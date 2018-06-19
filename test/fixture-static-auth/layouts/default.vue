<template>
  <div>
    <ul>
      <li>
        <router-link to="/">Index</router-link>
      </li>
      <li>
        <router-link to="/page-a">Page A - only logged in user</router-link>
      </li>
      <li>
        <router-link to="/page-b">Page B</router-link>
      </li>
    </ul>
    <nuxt/>
  </div>
</template>
