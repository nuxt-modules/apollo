<template>
    <div>
        This is the landing page.
        Please log in to get credentials to visit secret page "Page A"

        <form @submit.prevent="onSubmit" v-if="!isAuthenticated">
            <table>
                <tbody>
                <tr>
                    <td>
                        <label>Username</label>
                    </td>
                    <td>
                        <input type="text" v-model="credentials.email" required>
                    </td>
                </tr>
                <tr>
                    <td>
                        <label>Password</label>
                    </td>
                    <td>
                        <input type="password" v-model="credentials.password" required>
                    </td>
                </tr>
                </tbody>
            </table>
            <div v-if="submitting">Submitting ....</div>
            <button type="submit">Submit</button>
        </form>
        <div v-else>
            You are logged in!
            <button type="button" @click="onLogout">Logout</button>
        </div>
        <div style="color: red;" v-if="error">{{error}}</div>
        <div v-if="successfulData">{{successfulData}}</div>
    </div>
</template>

<script>
    import authenticateUserGql from '../gql/authenticateUser.gql'

    export default {
        head () {
            return {
                title: 'Startpage'
            }
        },
        data () {
            return {
                isAuthenticated:false,
                submitting: false,
                error: null,
                credentials: {
                    email: '',
                    password: ''
                },
                successfulData: null
            }
        },
        mounted(){
          this.isAuthenticated = !!this.$apolloHelpers.getToken()
        },
        methods: {
            async onSubmit () {
                this.submitting = true
                const credentials = this.credentials
                try {
                    const res = await this.$apollo.mutate({
                        mutation: authenticateUserGql,
                        variables: credentials
                    }).then(({data}) => data && data.authenticateUser)
                    await this.$apolloHelpers.onLogin(res.token, undefined, 7)
                    this.successfulData = res
                    this.isAuthenticated = true
                } catch (e) {
                    console.error(e)
                    this.error = e
                }
            },
            async onLogout(){
                await this.$apolloHelpers.onLogout()
                this.isAuthenticated = false
            }
        }
    }
</script>
