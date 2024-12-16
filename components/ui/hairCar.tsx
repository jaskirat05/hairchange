import * as React from "react"
import datahair from "../../constants/images.json"


import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import { Card, CardContent } from "./card"
import { Checkbox } from "./checkbox"
interface HairCarouselProps {
  selectImage: (image: string, description: string) => void;
}

export function HairCarousel(
  {selectImage}:HairCarouselProps
) {
  const [activeImg,setActiveImg]=React.useState<string|null>(null);
  
  return (
    <Carousel
    opts={{
      align: "start",
      dragFree: true,
      containScroll: "trimSnaps",
      slidesToScroll: 1,
      skipSnaps: false,
      loop: true,
    }}
    className="w-full max-w-sm"
  >
    <CarouselContent>
      {datahair.images.map((image, index) => (
        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
          <div className="p-2">
            <Card className="overflow-hidden">
              <CardContent 
                onClick={()=>{
                  selectImage(`hairstyles/${image[0]}`, image[2]);
                  setActiveImg(image[0])} 
                }
                className="p-0 cursor-pointer group"
              >
                <div className="relative aspect-square">
                  <img 
                    src={`hairstyles/${image[0]}`} 
                    className="w-full h-full object-cover"
                    alt={image[1]}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox checked={activeImg==image[0]} className="mb-2"/>
                    <h1 className="font-bold text-white text-sm uppercase text-center line-clamp-1">
                      {image[1]}
                    </h1>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious className="hidden md:flex" />
    <CarouselNext className="hidden md:flex" />
  </Carousel>
  )
}
