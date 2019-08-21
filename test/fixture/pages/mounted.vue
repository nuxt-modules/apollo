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
            title: 'mounted'
        }
    },
    data () {
        return {
            allPosts: []
        }
    },
    async mounted() {
        this.allPosts = await this.$apollo.query({
            query: gql`{
                allPosts {
                    id
                }
            }`
        }).then(({ data }) => data && data.allPosts)
    }
}
</script>
