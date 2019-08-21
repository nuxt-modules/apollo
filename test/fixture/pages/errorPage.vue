<template>
    <div>
        <pre>{{ allUsers }}</pre>
    </div>
</template>

<script>
import gql from 'graphql-tag'

export default {
    head () {
        return {
            title: 'Error Page'
        }
    },
    data () {
        return {
            allUsers: []
        }
    },
    apollo: {
        allUsers: {
            query: gql`{
                allUsers {
                    id
                    dasdsa
                }
            }`
        }
    }
}
</script>
