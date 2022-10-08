export type LaunchesT = {
  launches?: {
    id: number,
    details: string
    mission_name: string
    launch_year: number
    launch_success: boolean
    links: {
      article_link: string,
      flickr_images: string[]
    },
    rocket: {
      rocket_name:string
      rocket_type: string
    }
  }
}

export type ViewerT = {
  viewer?: {
    login: string
  }
}

export type DiscussionT = {
  repository?: {
    discussions?: {
      nodes?: {
        id?: number
        author?: {
          login?: string
          avatarUrl?: string
        }
        body?: string
      }[]
    }
  }
}
