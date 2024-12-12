import { HairCarousel } from "./ui/hairCar";
import * as React from "react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"

import { Button } from "./ui/button";
interface HairDrawerProps{
  imageSelector:(image:string,description:string)=>void;
}
  export function HairDrawer(
    {imageSelector}:HairDrawerProps
  ) {
    const [goal, setGoal] = React.useState(350)
   
    function onClick(adjustment: number) {
      setGoal(Math.max(200, Math.min(400, goal + adjustment)))
    }
   
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="default">Choose a hairstyle</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Choose HairStyle</DrawerTitle>
              <DrawerDescription>Select your desired hairstyle</DrawerDescription>
            </DrawerHeader>
           <HairCarousel selectImage={imageSelector}/>
            <DrawerFooter>
        
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }