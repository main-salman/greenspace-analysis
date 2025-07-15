import React from 'react'
import { Leaf } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-200 border-solid rounded-full animate-spin border-t-green-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="h-6 w-6 text-green-600 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner 