import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import { elements, renderLoader, clearLoader } from './views/base';

// the global state of the app
// the serach object
// current recipe obj 
// shopping list obj
// the liked recipes 
// each time we reload the app it will be empty 
const state = {};
window.state = state;

// SEARCH CONTROLLER

const controlSearch = async () => {
	// 1. get the query from the view
	const query = searchView.getInput();
	// console.log(query);


	if(query){
		// 2. new search obj and add it to state 
		state.search = new Search(query);

		// 3. prepare ui for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try{
		// 4. search for recipies 
		await state.search.getResults();

		// 5. render results on UI
		clearLoader();
		searchView.renderResults(state.search.result);

		}catch(error){
			alert('Something went wrong w. your search :( please try again');
			clearLoader();
		}
	}
}

elements.searchForm.addEventListener('submit', e => {
	// prevents reload
	e.preventDefault();
	controlSearch();
});

elements.searchForm.addEventListener('load', e => {
	// prevents reload
	e.preventDefault();
	controlSearch();
});


elements.searchResPages.addEventListener('click', e=> {
		const btn = e.target.closest('.btn-inline');
		if(btn){
			const goToPage = parseInt(btn.dataset.goto, 10);
			searchView.clearResults();
			searchView.renderResults(state.search.result, goToPage);
		}
});


// RECIPE CONTROLLER

const controlRecipe = async () => {
	// get the id from the url
	const id = window.location.hash.replace('#', '');
	// console.log(id);

	if(id){
		recipeView.clearRecipe();
		// prepare the UI for changes
		renderLoader(elements.recipe);

		// highlight selected recipe
		if(state.search) searchView.highlightSelected(id);

		// create new recipe object 
		state.recipe = new Recipe(id);

		try{
 			// get recipe data and parse ingredients
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();
			// calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// render recipe
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)
				);
		}catch(error){
			alert('Error processing recipe');
		}
	}
};


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**

**LIST CONTROLLER**

**/

const controlList = () => {
	// create a new list if there is none yet 
	if (!state.list) state.list = new List();

	// add each ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
}

// handle /delete/update items on list 

elements.shopping.addEventListener('click', e=> {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// handle the delete button
	if(e.target.matches('.shopping__delete, .shopping__delete *')){
		// delete from state
		state.list.deleteItem(id);
		// delete from UI
		listView.deleteItem(id);

		// handle the count update
	}else if(e.target.matches('.shopping__count-value')){
		const val = parseFloat(e.target.value,10);
		state.list.updateCount(id, val);
	}
});

/**

**LIKES CONTROLLER**

**/

const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	// user has not liked current recipe
	if (!state.likes.isLiked(currentID)){
	// add like to the state
	const newLike = state.likes.addLike(
		currentID,
		state.recipe.title,
		state.recipe.author,
		state.recipe.img
		);
	// toggle the like button
	likesView.toggleLikeBtn(true);
	// add like to UI list
	likesView.renderLike(newLike); 
	// console.log(state.likes);
	// user has liked the current recipe
	} else{
	// remove like from the state
	state.likes.deleteLike(currentID);
	//toggle the like button
	likesView.toggleLikeBtn(false);
	console.log(state.likes);
	//remove like from UI list 
	likesView.deleteLike(currentID);
	}

	likesView.toggleLikeMenu(state.likes.getNumLikes());

};

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


// event handlers for servings
// elements.recipe.addEventListener('click', e => {
// 	if(e.target.matches('btn-decrease, .btn-decrease *')){
// 		// decrease button is clicked
// 		if (state.recipe.servings > 1) {
// 			state.recipe.updateServings('dec');
// 			recipeView.updateServingsIngredients(state.recipe);
// 		}
// 	}else if(e.target.matches('btn-increase, .btn-increase *')){
// 		// increase button is clicked
// 		state.recipe.updateServings('inc');
// 		recipeView.updateServingsIngredients(state.recipe);
// 	}
// 	console.log(state.recipe);
// });

elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
    	// add ingredients to shopping list 
    	controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
    	controlLike();
    }

    });


