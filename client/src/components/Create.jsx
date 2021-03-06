import React, { Component } from 'react';
// withRouter used to redirect to a different url within a function
import { withRouter } from 'react-router-dom';
import axios from 'axios';


class Create extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: localStorage.getItem('Token'),
      userId: 0 || sessionStorage.getItem('userId'),
      title: null,
      description: null,
      ingredients: [],
      instructions: [],
      isSaved: false,
    };
    // counter is used to provide a unique key to each instruction
    this.counter = 0;
    // ingredient input template
    this.sampleIngredient = {
      name: '',
      ndbno: '',
      quantity: '',
      isValidated: false,
      // isSaved: false,
      nutrition: {},
    };
    this.updateRecipe = this.updateRecipe.bind(this);
    this.addNewIngredient = this.addNewIngredient.bind(this);
    this.addNewInstruction = this.addNewInstruction.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.postRecipe = this.postRecipe.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateTitle = this.updateTitle.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    // if (this.state.isSaved) {
    //   this.toggleSaved();
    // } else 
    console.log('Inside create page', this.props.saveDescription)
    this.props.saveDescription(this.state.title , this.state.description);
    if (this.state.title) {

      this.updateRecipe(event.target.name, this.state.title);
    }

    if (this.state.description) {
      this.updateRecipe(event.target.name, this.state.description);
    }
    this.props.history.push('/ingredients');
    console.log(this.state);
  }

  updateTitle(event) {
    this.setState({ title: event.target.value });
  }

  updateDescription(event) {
    this.setState({ description: event.target.value });
  }

  // tried to abstract this function to handle any adjustments to the top level recipe state
  // see different Create child componenets for how it is used, but basically:
  // 'title' and 'descrition' will pass a string for the first value, and no index or callback
  // 'ingredients' and 'instructions' will pass an array with the second value equal to which property of the
  //     ingredient/instruction object will be updated with the newValue (index is also provided)
  // callback is occasionally used when action needs to be taken AFTER state is updated
  updateRecipe(statePiece, newValue, index, callback) {
    if (!Array.isArray(statePiece)) {
      // square brackets around the key value indicates it is a variable to be evaluated
      this.setState({ [statePiece]: newValue });
    } else {
      let arrayName = statePiece[0];
      let propertyName = statePiece[1];
      const newStateArray = this.state[arrayName].map(
        (ingredient, ingredientIndex) => {
          if (ingredientIndex !== index) {
            return ingredient;
          } else {
            // spread syntax returns the ingredient as is, (except for whatever is overwritten afterwards)
            // in this case, the [propertyName] is overwritten but the rest of the ingredient remains as is
            return { ...ingredient, [propertyName]: newValue };
          }
        },
      );
      // setState accepts a callback, to be completed when state is done updating
      this.setState({ [arrayName]: newStateArray }, () => {
        if (callback) {
          callback();
        }
      });
    }
  }

  // both of the 'addNew...' functions below update the counter so that the next added item will have a unique key
  addNewIngredient() {
    // conditional ensures that user cannot add
    if (this.state.ingredients.every(ingredient => ingredient.isSaved)) {
      let newIngredient = { ...this.sampleIngredient, counter: this.counter };
      this.setState(
        prevState => ({
          ingredients: prevState.ingredients.concat([newIngredient]),
        }),
        () => {
          this.counter++;
        },
      );
    }
  }

  // essentially identical to addNewIngredient above, except that it doesn not make use of a template
  addNewInstruction() {
    if (this.state.instructions.every(instruction => instruction.isSaved)) {
      this.setState(
        prevState => ({
          instructions: prevState.instructions.concat([
            {
              counter: this.counter,
              text: '',
              isSaved: false,
            },
          ]),
        }),
        () => {
          this.counter++;
        },
      );
    }
  }

  // abstracted to delete an item from either the 'ingredients' or 'instructions' stateArray
  deleteItem(stateArray, index) {
    this.setState(prevState => ({
      [stateArray]: prevState[stateArray].filter((item, itemIndex) => {
        return itemIndex !== index;
      }),
    }));
  }

  updateUser() {
    this.setState({
      userId: this.props.passUserId,
    });
  }

  postRecipe() {
    // make sure that recipe has all the desired information before submitting
    let isValidRecipe = true;
    if (
      typeof this.state.title !== 'string' ||
      this.state.title.trim().length === 0
    ) {
      isValidRecipe = false;
    }
    this.state.ingredients.forEach(ing => {
      if (ing.isSaved === false) {
        isValidRecipe = false;
      }
    });
    this.state.instructions.forEach(inst => {
      if (inst.isSaved === false) {
        isValidRecipe = false;
      }
    });
    if (isValidRecipe) {
      const recipe = Object.assign({}, this.state);
      // database expects an array of strings for instructions
      recipe.instructions = this.state.instructions.map(obj => obj.text);
      axios
        .post(`/user/recipes/?Token=${this.state.token}`, {
          recipe,
        })
        .then(response => {
          // console.log(response);
          // response contains the database id for the newly created recipe
          // use this to redirect to the full recipe view for that recipe
          // (this.props.history.push can be used because component is wrapped by withRouter - see export statement)
          this.props.history.push(`/ingredients`);
        })
        .catch(err => {
          console.error(err);
        });
    } else {
      alert(
        'Please make sure all ingredients and instructions are saved and title exists',
      );
    }
  }

  render() {
    return (
      <div id="create">
        {/* <CreateTitle updateRecipe={this.updateRecipe} />
        <CreateDescription updateRecipe={this.updateRecipe} />
        <CreateIngredients
          ingredients={this.state.ingredients}
          addNewIngredient={this.addNewIngredient}
          updateRecipe={this.updateRecipe}
          deleteItem={this.deleteItem}
        />
        <CreateInstructions
          instructions={this.state.instructions}
          addNewInstruction={this.addNewInstruction}
          updateRecipe={this.updateRecipe}
          deleteItem={this.deleteItem}
        /> */}
        <div className="ui middle aligned center aligned grid">
          <div className="column">
            <h2 className="ui header">
              <div className="content">What's Cookin'?</div>
            </h2>
            <form
              className="ui large form inverted"
              id="create-title"
              name="title"
              onSubmit={this.handleSubmit}>
              <div className="ui stacked secondary  segment">
                <div className="field">
                  <div className="ui left icon fluid input">
                    {/* <i className="user icon" /> */}
                    <input
                      type="title"
                      name="title"
                      placeholder="Recipe Title"
                      onChange={this.updateTitle}
                      disabled={this.state.isSaved}
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="ui left icon fluid input ">
                    {/* <i className="edit icon" /> */}
                    <textarea
                      id="description"
                      type="text"
                      name="description"
                      onChange={this.updateDescription}
                      placeholder="Description"
                    />
                  </div>
                </div>
                <button
                  className="ui fluid large teal submit button"
                  onClick={this.handleSubmit}
                  rel="stylesheet"
                  to="/ingredients"
                  type="submit"
                  value="Submit">
                  Add Ingredients
                </button>
                {/* <Link to={{ pathname: '/ingredients', state: { updateRecipe } }}>My route</Link> */}
                {/* </div> */}
              </div>
              <div className="ui error message" />
            </form>
            {/* <div className="ui message">
              New to us?
              <a href="/signup">
                {'  '}
                Sign Up
              </a>
            </div> */}
          </div>
        </div>
      </div>
    );
  }
}

// wrapped with withRouter in order to access props.history
export default withRouter(Create);
