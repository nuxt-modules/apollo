<template>
    <div>
        Page A
        This page is protected with a middleware which checks if the gql request is authenticated
    </div>
</template>

<script>
    export default {
        head () {
            return {
                title: 'Page A'
            }
        },
        middleware: ['isAuth']
    }
</script>
