app.component('pager-component' , {
	name: 'pagerComponent',
	props: {
		total: {type: Number, default: 0},
		showPerPage: {type: Boolean, default: true}
	},
	template: `
	<nav class="pagerArea">
		<label v-if="showPerPage" class="perPage">
			{{ t('pager.perPage') }}
			<select :value="itemsPerPage" @change="changeItemsPerPage($event.target.value)">
				<option v-for="size in itemsPerPageOptions" :value="size">{{ size }}</option>
			</select>
		</label>
		<div v-if="pageCount > 1" class="pageButtons">
			<button type="button" class="pageButton" :disabled="page === 0" @click="goTo(page - 1)" :title="t('pager.previous')" :aria-label="t('pager.previous')">‹</button>
			<template v-for="(item, index) in pageItems" :key="index">
				<span v-if="item === null" class="pageGap">…</span>
				<button v-else type="button" class="pageButton" :class="{active: item === page}" :aria-current="item === page ? 'page' : null" @click="goTo(item)" :aria-label="t('pager.page', {page: item + 1})">{{ item + 1 }}</button>
			</template>
			<button type="button" class="pageButton" :disabled="page >= pageCount - 1" @click="goTo(page + 1)" :title="t('pager.next')" :aria-label="t('pager.next')">›</button>
		</div>
		<span class="pagerCount">{{ t('pager.items', {count: total}, total) }}</span>
	</nav>
	`,
	setup(props) {
		const route = VueRouter.useRoute()
		const router = VueRouter.useRouter()
		let setLocalStorage = Vue.inject('setLocalStorage');

		const itemsPerPageOptions = [12, 24, 48, 96, 192, 384, 768]

		const itemsPerPage = Vue.computed(function() {
			return Math.max(1, parseInt(route.params.itemsPerPage) || settings.itemsPerPageDefault)
		})

		const page = Vue.computed(function() {
			return Math.floor((parseInt(route.params.startIndex) || 0) / itemsPerPage.value)
		})

		const pageCount = Vue.computed(function() {
			return Math.ceil(props.total / itemsPerPage.value)
		})

		const pageItems = Vue.computed(function() {
			let around = window.innerWidth < 500 ? 1 : 2
			let items = []
			for(let i = 0; i < pageCount.value; i++) {
				if(i === 0 || i === pageCount.value - 1 || Math.abs(i - page.value) <= around) {
					items.push(i)
				} else if(items[items.length - 1] !== null) {
					items.push(null)
				}
			}
			return items
		})

		const goTo = function(target) {
			target = Math.max(0, Math.min(pageCount.value - 1, target))
			router.push({name: 'images', params: {startIndex: target * itemsPerPage.value, itemsPerPage: itemsPerPage.value}, query: route.query})
		}

		const changeItemsPerPage = function(value) {
			setLocalStorage(settings.itemsPerPageStorageName, value)
			router.push({name: 'images', params: {startIndex: 0, itemsPerPage: value}, query: route.query})
		}

		return {
			changeItemsPerPage,
			goTo,
			itemsPerPage,
			itemsPerPageOptions,
			page,
			pageCount,
			pageItems
		}
	}
})
