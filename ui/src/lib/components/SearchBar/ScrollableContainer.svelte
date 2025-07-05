<script lang="ts">
	export let isScrolledContentAtBottomOfTheContainer: boolean;

	let box: HTMLDivElement;
	let clientHeight = 0;
	let scrollTop = 0;
	let scrollHeight = 0;

	const scrollOffset = 10;

	function parseScroll() {
		scrollTop = box.scrollTop;
		scrollHeight = box.scrollHeight;
		clientHeight = box.clientHeight;

		if (scrollHeight - scrollTop - clientHeight <= scrollOffset) {
			isScrolledContentAtBottomOfTheContainer = true;
		} else {
			isScrolledContentAtBottomOfTheContainer = false;
		}
	}
</script>

<div class="container" bind:this={box} on:scroll={parseScroll}>
	<slot />
</div>

<style>
	:root {
		--scrollable-container-height: 100%;
	}
	.container {
		overflow: auto;
		height: var(--scrollable-container-height);
		/* border: 1px solid var(--color-line); */
	}
</style>
