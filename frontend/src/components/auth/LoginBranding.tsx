import React from 'react'

export default function LoginBranding() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col items-center justify-center overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-white/10 rounded-full blur-[8rem]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[60rem] h-[60rem] bg-white/5 rounded-full blur-[10rem]"></div>
      
      <div className="relative z-10 text-center px-12">
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            alt="Math Education Illustration" 
            className="w-[25rem] h-auto mx-auto rounded-xl shadow-2xl" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGIQTcprY83xAjv0z4XyZWm9LJsRcfLVtoF31sieWB0_ENDZiYijROoNPnpz5vGkSwGaxxSASyktNOQ9uWHx6AuAatltAM5ElgGJ7-0LktQACInwqZXqIsL6UA0kmhl6dVMBbG3-j13Bm1DpE1DhLV32lX7bJ_SC3bmQ6l48iR3K1otYEDIGIJ9Uz2dCd2_-esIfj4RdzQ1Yq77y0XojJl-V_eGQPk05tHFZrT5wdn2QkFqcfIFxH358OxYKw4KdzOFB9530JdQCLh"
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Chào mừng bạn trở lại!</h1>
        <p className="text-white/80 text-lg max-w-lg mx-auto">
          Cùng chinh phục môn Toán mỗi ngày với các phương pháp học hiện đại và thú vị.
        </p>
      </div>

      {/* Small floating math symbols for aesthetics */}
      <div className="absolute top-20 left-20 text-white/20 text-6xl font-bold">∑</div>
      <div className="absolute bottom-20 right-40 text-white/20 text-6xl font-bold">π</div>
      <div className="absolute top-1/2 right-10 text-white/20 text-5xl font-bold">√</div>
    </div>
  )
}
