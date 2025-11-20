<template>
	<div class="modmenu-screen">
		<section v-if="display()" class="modmenu-page-content roundme_sm ss_marginright bg_blue6 common-box-shadow">
			<header class="f_row align-items-center">
				<section>
					<h2 class="nospace">Mods</h2>
				</section>
				<aside class="justify-self-end text-right">
					<p class="opacity-7">{{ mods.length }} mods</p>
				</aside>
			</header>

			<section class="mod-list-section paddings_lg">
			<div v-if="mods.length" class="mod-list">
				<mod-item 
					v-for="(mod, idx) in mods"
					:key="idx"
					:mod="mod"
					@toggle="onToggle(idx, $event)">
				</mod-item>
			</div>
			</section>
		</section>
	</div>
</template>
