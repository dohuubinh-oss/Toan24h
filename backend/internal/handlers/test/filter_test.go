package test

import (
	"fmt"
	"strings"
	"testing"
)

func TestFilterLogic(t *testing.T) {
	type filter struct {
		Query string
		Args  []interface{}
	}
	var filters []filter

	filters = append(filters, filter{"grade = ?", []interface{}{9}})
	filters = append(filters, filter{"topic = ?", []interface{}{"Đại số"}})

	parentConds := []string{}
	childConds := []string{}
	var parentArgs []interface{}
	var childArgs []interface{}

	for _, f := range filters {
		parentConds = append(parentConds, f.Query)
		parentArgs = append(parentArgs, f.Args...)

		childConds = append(childConds, f.Query)
		childArgs = append(childArgs, f.Args...)
	}

	parentWhere := strings.Join(parentConds, " AND ")
	childWhere := strings.Join(childConds, " AND ")

	combinedQuery := fmt.Sprintf("(%s) OR id IN (SELECT parent_id FROM questions WHERE parent_id IS NOT NULL AND (%s))", parentWhere, childWhere)
	
	fmt.Println("Query:", combinedQuery)
	fmt.Println("Args:", append(parentArgs, childArgs...))
}
