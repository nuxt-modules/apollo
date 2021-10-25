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
            title: 'asyncData'
        }
    },
    data () {
        return {
          episodesByIds: []
        }
    },
    async asyncData({ app }) {
        const client = app.apolloProvider.defaultClient
        const episodesByIds = await client.query({
            query: gql`{
                episodesByIds(ids: [1]) {
                    name
                }
            }`
        }).then(({ data }) => data && data.episodesByIds)
        return { episodesByIds }
    }
}
</script>
