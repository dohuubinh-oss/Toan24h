package services

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/modeptrai/exam-model-backend/internal/config"
)

const GradingQueueKey = "queue:grading"

type GradingJob struct {
	SubmissionID uuid.UUID `json:"submissionId"`
}

// QueueGradingJob pushes a grading job to the Redis queue.
func QueueGradingJob(submissionID uuid.UUID) error {
	ctx := context.Background()
	job := GradingJob{SubmissionID: submissionID}
	
	data, err := json.Marshal(job)
	if err != nil {
		return err
	}

	return config.RedisClient.LPush(ctx, GradingQueueKey, data).Err()
}

// StartGradingWorkers starts a pool of workers to process grading jobs from Redis.
func StartGradingWorkers(workerCount int, processFunc func(submissionID uuid.UUID)) {
	log.Printf("Starting %d grading workers...", workerCount)
	for i := 0; i < workerCount; i++ {
		go func(workerID int) {
			ctx := context.Background()
			for {
				// BRPOP blocks until a job is available, timeout after 5 seconds to allow graceful shutdown checks if needed
				result, err := config.RedisClient.BRPop(ctx, 5*time.Second, GradingQueueKey).Result()
				if err != nil {
					// Redis nil means timeout, just continue
					if err.Error() != "redis: nil" {
						// log.Printf("Worker %d: Error pulling from queue: %v", workerID, err)
					}
					continue
				}

				if len(result) == 2 {
					var job GradingJob
					if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
						log.Printf("Worker %d: Failed to parse job: %v", workerID, err)
						continue
					}
					
					log.Printf("Worker %d: Processing grading for submission %s", workerID, job.SubmissionID)
					// Call the grading function
					processFunc(job.SubmissionID)
					log.Printf("Worker %d: Finished grading for submission %s", workerID, job.SubmissionID)
				}
			}
		}(i)
	}
}
