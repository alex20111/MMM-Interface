export interface ViewModule {
    index: number
   // identifier: string
    name: string
    path: string
    file: string
    configDeepMerge: boolean
    config: any
    classes: string
    hidden: boolean
    lockStrings: any[]
    position?: string
    header?: string
  }