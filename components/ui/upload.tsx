import React from 'react'
import { CameraIcon } from 'lucide-react'
import { Button } from './button'

export function UploadButton() {
  return (
    <Button className="flex items-center justify-center w-14 h-14 bg-orange-500 rounded-full relative pointer-events-none">
        <div className='bg-primary absolute w-20 h-20 rounded-full -z-30 hover:bg-blue-600'></div>
    <CameraIcon className="w-8 h-8 text-white" />
  </Button>
  )
}

