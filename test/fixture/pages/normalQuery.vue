<template>
    <div>
        <div v-for="episode in episodesByIds" :key="episode.name">{{ episode.name }}</div>
    </div>
</template>

<script>
import gql from 'graphql-tag'

export default {
    head () {
        return {
            title: 'Normal Query'
        }
    },
    data () {
        return {
          episodesByIds: []
        }
    },
    apollo: {
        episodesByIds: {
            query: gql`{
                episodesByIds(ids: [1]) {
                    name
                }
            }`
        }
    }
}
</script>
