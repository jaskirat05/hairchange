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
    }}
    className="w-full max-w-sm"
  >
    <CarouselContent>
      {datahair.images.map((image, index) => (
        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
          <div className="p-1">
            <Card>
              <CardContent  onClick={()=>{
                selectImage(`hairstyles/${image[0]}`, image[2]);
                setActiveImg(image[0])} 
              }
              className="flex flex-col space-y-4 aspect-asquare items-center max-h-[50vh] justify-center p-6">
                <img src={`hairstyles/${image[0]}`} className="w-full h-full rounded-full relative"/>
                <Checkbox className="" checked={activeImg==image[0]?true:false}/>
                <h1 className="font-bold text-muted-foreground text-md uppercase">{image[1]}</h1>
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
  )
}
