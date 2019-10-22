<template>
    <div>
        <div v-for="post in allPosts" :key="post.id">{{ post.id }}</div>
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
            allPosts: []
        }
    },
    async asyncData({ app }) {
        const client = app.apolloProvider.defaultClient
        const allPosts = await client.query({
            query: gql`{
                allPosts {
                    id
                }
            }`
        }).then(({ data }) => data && data.allPosts)
        return { allPosts }
    }
}
</script>
