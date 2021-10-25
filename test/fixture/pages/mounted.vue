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
            title: 'mounted'
        }
    },
    data () {
        return {
            episodesByIds: []
        }
    },
    async mounted() {
        this.episodesByIds = await this.$apollo.query({
            query: gql`{
                episodesByIds(ids: [1]) {
                    name
                }
            }`
        }).then(({ data }) => data && data.episodesByIds)
    }
}
</script>
