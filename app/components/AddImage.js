import React from 'react';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import AddPhoto from 'material-ui/svg-icons/image/add-a-photo';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';

// keys are in seperate file and is added to the .gitignore so that our account secrets arenot exposed through github or deployment
import keys from 'APP/keys.js';

// require the client
var Clarifai = require('clarifai');
// instantiate a new Clarifai app passing in your clientId and clientSecret
var app = new Clarifai.App(
  keys.CLIENT_ID,
  keys.CLIENT_SECRET
);

/* ----- COMPONENT ----- */

export default class AddImage extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      files: {},
      holdingURL: '',
      imgURL: '',
      tags: [],
      loading: false,
      error: '',
    };

    this.handleURLSubmit = this.handleURLSubmit.bind(this);
    this.handleImgUpload = this.handleImgUpload.bind(this);
    this.validFile = this.validFile.bind(this);
    this.useClarifaiAPI = this.useClarifaiAPI.bind(this);
    this.storeTags = this.storeTags.bind(this);
  }

  // check that the image provided is a supported type by clarifai
  validFile(imageName){
    let lowercaseImageName = imageName.toLowerCase();
    return (
      lowercaseImageName.indexOf(".jpg") !== -1 ||
      lowercaseImageName.indexOf(".jpeg") !== -1 ||
      lowercaseImageName.indexOf(".tiff") !== -1 ||
      lowercaseImageName.indexOf(".bmp") !== -1
    )
  }

  useClarifaiAPI(input){
    // ********currently isn't displayed on the site, but it does work**************

    //console.log('input', input)

    // clarifai provides this shortcut way of sending a req with the correct headers (ie. instead of sending a post request to the 3rd party server ourselves and getting the response) you only need to provide either the image in bytes OR a url for the image
    // https://developer.clarifai.com/guide/predict

    app.models.predict(Clarifai.GENERAL_MODEL, input)
    .then(response => {
      const predictions = response.outputs[0].data.concepts

      let tags = [];

      predictions.forEach(guess => {
        if (guess.value > 0.80 &&
            guess.name !== 'no person'
          && guess.name !== 'one') {
          tags.push(guess.name)
        }
      })

      // if (tags.length > 7) {
      //   tags.splice(7)
      // }

      // logging in browser so you can see what's happening
      // for clarifying purposes only
      //  - jenny

      // console.log(
      //   'this is the whole response that clarifai sends back ',
      //   response
      // )
      // console.log(
      //   'inside the response, the outputs array has data on the words associated with the input image, which i call predictions ',
      //   predictions
      //   )
      // console.log(
      //   'i like to filter that array of objects down to just single words of at least 80% certainty',
      //   tags
      // )

      // this changes the local state, which will
      this.storeTags(tags);
    },
    err => {
      console.error(err);
    })
  }

  storeTags(tags){
    this.setState({
      tags: tags,
      loading: false,
    });
  }

/*  handleURLChange(e){

    if (!this.validFile(e.target.value)) {
      this.setState({
        error: 'Supported File Types: JPEG, TIFF, BMP'
      })
    }

    else {
      this.setState({
        holdingURL: e.target.value,
        tags: [],
      })
    }

  }*/

  // onClick event for providing a url
  handleURLSubmit(e){
    e.preventDefault();

    if (this.validFile(e.target.imgurl.value)) {
      this.setState({
        imgURL: e.target.imgurl.value,
        loading: true,
        tags: [],
        error: '',
      })
      // send the image as a message
      this.props.addMessage(['you', e.target.imgurl.value, true]);
    }

    else {
      this.setState({
        error: 'Supported File Types: JPEG, TIFF, BMP'
      })
      return;
    }

    this.useClarifaiAPI(e.target.imgurl.value);

  }

  // onClick event for taking or choosing a local picture file
  handleImgUpload(e){
    // get the file off of the submit event
    var files = e.target.files,
        file;

    if (!this.validFile(files[0].name)) {
      this.setState({
        error: 'Supported File Types: JPEG, TIFF, BMP'
      })
      return;
    }

    if (files && files.length > 0) {

      file = files[0];

      this.setState({
        file: file,
        loading: true,
        tags: [],
        error: '',
      })

      try {
        // Get window.URL object
        var URL = window.URL || window.webkitURL;
        const imgURL = URL.createObjectURL(file);

        this.setState({
          imgURL: imgURL
        })
        // send the image as a message
        this.props.addMessage(['you', imgURL, true]);

        const fileReader = new FileReader()
        fileReader.readAsDataURL(file)
        // you only have access to the read file inside of this callback(?)function
        fileReader.onload = () => {

          const imgBytes = fileReader.result.split(',')[1]
          this.useClarifaiAPI(imgBytes)
        }
      }
      catch (err) {
        try {
          // Fallback if createObjectURL is not supported
          var fileReader = new FileReader();
          fileReader.onload = function (event) {
            this.setState({
              imgURL: event.target.result,
            })
          };
          fileReader.readAsDataURL(file);
        }
        catch (err) {
          // Display error message

        }
      }
    }
  }

  render(){
    return (
      <IconMenu
          style={{display: "inline-block"}}
          id="photo-button"
          iconButtonElement={<IconButton><AddPhoto /></IconButton>}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'bottom'}}
          touchTapCloseDelay={0}
        >
          <MenuItem primaryText="Image URL:" />
          <MenuItem>
            <div>
              { this.state.error && <div className="alert alert-warning">{this.state.error}</div> }
              <form onSubmit={this.handleURLSubmit}>
                <input
                  type="submit"
                  value="Use this image URL"
                  size="80"
                />
                <input
                  type="text"
                  id="imgurl"
                  placeholder="Image URL"
                />
              </form>
            </div>
          </MenuItem>
          <Divider />
          <MenuItem primaryText="From file:"/>
          <MenuItem>
            <input
              id="take-picture"
              type="file"
              onChange={this.handleImgUpload}
              accept="image/*"
              />
          </MenuItem>
        </IconMenu>
    )
  }
}

