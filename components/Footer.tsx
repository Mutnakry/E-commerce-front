'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto relative">
      {/* Thin vertical green line on the left */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500"></div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left side - Navigation Links */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <a href="#" className="text-green-500 hover:text-green-400 transition-colors text-sm">
              About Us
            </a>
            <a href="#" className="text-green-500 hover:text-green-400 transition-colors text-sm">
              User Agreement
            </a>
            <a href="#" className="text-green-500 hover:text-green-400 transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-green-500 hover:text-green-400 transition-colors text-sm">
              Terms And Conditions
            </a>
            <a href="#" className="text-green-500 hover:text-green-400 transition-colors text-sm">
              Frequently Asked Questions
            </a>
          </div>

          {/* Right side - Payment Methods */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* WeChat Pay */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                {/* WeChat Pay icon - speech bubble with checkmark */}
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="text-green-500 text-sm font-medium whitespace-nowrap">微信支付 WeChat Pay</span>
            </div>

            {/* Alipay */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                {/* Alipay icon - stylized character */}
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <span className="text-green-500 text-sm font-medium whitespace-nowrap">支付宝 ALIPAY</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-white text-sm text-center">
            COPYRIGHT © 2025 Gosking, ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}

