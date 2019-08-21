<template>
    <div>
        <div v-for="post in allPosts" :key="post.id">{{ post.idi }}</div>
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
            allPosts: []
        }
    },
    apollo: {
        allPosts: {
            query: gql`{
                allPosts {
                    id
                }
            }`
        }
    }
}
</script>
