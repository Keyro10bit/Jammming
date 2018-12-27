let accessToken = '';
let expiresIn = '';
let userId = '';

const clientId = 'c67aaeb3ac9442dfa4bd5077c2ec3c53';
const redirectUri = 'http://localhost:3000/';

export const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    let urlAccessToken = window.location.href.match(/access_token=([^&]*)/);
    let urlExpiresIn = window.location.href.match(/expires_in=([^&]*)/);

    if (urlAccessToken && urlExpiresIn) {
      accessToken = urlAccessToken[1];
      expiresIn = urlExpiresIn[1];
      window.setTimeout(()=>accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    }
    else {
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
    }
  },

  search(term){
    accessToken = Spotify.getAccessToken();
    const thisUrl = `https://api.spotify.com/v1/search?type=track&q=${term}`;
    return fetch(thisUrl,{
      headers: {Authorization: `Bearer ${accessToken}`}
    }).then(response=>{
      if(response.ok){
        return response.json();
      }else{
        console.log('Error! Failed to return Request')
      }
    }).then(jsonResponse=>{
      if(!jsonResponse.tracks) {
        return [];
    }else {
      return jsonResponse.tracks.items.map(track=>{
        return  {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri,
            coverArt: track.album.images[2].url
          }
        });
      }
    });
  },

  savePlaylist(playlistName, trackUris){
    let playlistId;

    if (!playlistName || !trackUris){
      return;
    }
    else {
       return fetch('https://api.spotify.com/v1/me',
          {
            headers: {Authorization: `Bearer ${accessToken}`}
          }
        ).then(response => {
          if(response.ok) {
            return response.json();
          }
          throw new Error('Request failed!');
        }, networkError => console.log(networkError.message)
      ).then(jsonResponse => {
        userId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,
          {
           headers: {Authorization: `Bearer ${accessToken}`},
           method: 'POST',
           body: JSON.stringify({name: playlistName})
         }
       ).then(response => {
           if (response.ok) {
             return response.json();
           }
           throw new Error('Request failed!');
         }, networkError => console.log(networkError.message)
         ).then(jsonResponse => {
           playlistId = jsonResponse.id;
           return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
             {
               headers: {Authorization: `Bearer ${accessToken}`},
               method: 'POST',
               body: JSON.stringify({uris: trackUris})
             }
           ).then(response => {
               if(response.ok) {
                 return response.json();
               }
               throw new Error('Request failed!');
             }, networkError => console.log(networkError.message)
             ).then(jsonResponse =>{
               console.log('Playlist Saved Sucessfully');
               return jsonResponse.id;
             });
         });
      });
    }
  }
}
