+function($) {
    var DEFAULT_FOLDER_ICON = 'https://s.imgur.com/images/icons/Teal-Folder.svg',
        CSS_CLIP_PATH       = {'clip-path': 'polygon(37% 2%, 42% 10%, 94% 10%, 95% 95%, 93% 98%, 4% 98%, 4% 6%, 6% 1%)'},
        $favorites_wrap     = $('<div>'),
        folder_contents     = {},
        $current_comment_box = null;
        call_favorites_once = true;
    $favorites_wrap.addClass("favorites-reaction-total-wrapper");
    $(document.body).append($favorites_wrap);
    $favorites_wrap.css({
                         position: 'absolute', 
                         top: '0px', 
                         left: '0px', 
                         width:'200px', 
                         height: '300px',
                         background: '#2c2f34',
                         border: '1px solid #eee',
                         'border-radius': '7px',
                         'overflow-y':'scroll',
                         'overflow-x':'hidden'
                       });
    var $search_input = $('<input placeholder="Search...">');
    var folders_search_value = "";
    $(document).on('click','.return-to-favorite-folders-overview', (e) => {
           $favorites_wrap.find('.favorite-folders-wrap').show();
           $favorites_wrap.find('.folder-contents-wrap').remove();
           $search_input.val(folders_search_value);
           $search_input.trigger('input');
           e.preventDefault();
           return false;
    });
    $(document).on('click','.get_favorites_by_folder', (e) => {
        let $target = $(e.target);
        let folderData = $target.data('favorite-folder');
        loadFolderContents(folderData.id, ($contents) => {
           $favorites_wrap.find('.favorite-folders-wrap').hide();
           $favorites_wrap.find('.folder-contents-wrap').remove();
           $favorites_wrap.append($contents);
           folders_search_value = $search_input.val();
           $search_input.val(''); 
           $search_input.trigger('input');
        });
    });
    var loadFolderContents = (folder_id, callback) => {
   
         if(!folder_contents[folder_id]) {
             let $folder_contents_wrap = $('<div>');
             $folder_contents_wrap.append('<div style="width: 100%;height:40px;"><div class="btn navPrev icon icon-arrow-left return-to-favorite-folders-overview"></div></div>');
             $folder_contents_wrap.addClass('folder-contents-wrap');
             folder_contents[folder_id] = $folder_contents_wrap;
             let url = 'https://api.imgur.com/3/folders/'+folder_id+'/favorites?page=';
             let count = 0;
             let count_limit = 2;
             let hasCalled = false;
             let fetch_func = (url_to_fetch) => {
                 window.fetch(url_to_fetch,{
                    credentials: "include"
                }).then((response) => {
                   if(response.status == 200) {
                       response.json().then((jsonPromise) => {
                          let data = jsonPromise.data;
                          if(data.length > 0) {
                              // Emulate android app folders behaviour in sorting
                              data.sort((a,b) => {
                                 return b.id - a.id;
                              });

                              $.each(data, (i, image) => {
                                 if(image.album) return;
                                 let $icon = $('<div title="'+(image.title? image.title :'') + ' ' + (image.description ? image.description : '')+'">');
                                 $icon.css({'width':'75px','height':'60px','background-size': '75px 60px', 'background-repeat':'no-repeat',margin:'3px', display: 'inline-block', 'background-image': 'url('+image.link.substring(0,image.link.lastIndexOf('.')) +'s.png)'});
                                 $icon.addClass('folder-content-reaction');
                                 $icon.data('image-data',image);
                                 $folder_contents_wrap.append($icon);
                              });
                              count++;
                              if(count < count_limit) {
                                 fetch_func(url + count);
                              }
                              else {
                                  let $load_even_more = $('<a>load more</a>');
                                  $load_even_more.on('click', (e) => {
                                      $load_even_more.remove();
                                      count_limit += 10;
                                      fetch_func(url + count);
                                       
                                       e.preventDefault();
                                       e.stopPropagation();
                                       return false;
                                  });
                                  $folder_contents_wrap.append($load_even_more);
                                  
                              }
                              
                          }
                          if(!hasCalled) {
                            hasCalled = true;
                            callback(folder_contents[folder_id]);
                          }
                          
                       })
                   }
                })
             };
             fetch_func(url + count);
         }
         else {
            callback(folder_contents[folder_id]);
         }
    }

    $(document).on('click', (e) => { 
      if(!e.originalEvent.skipTheClosingAction && $favorites_wrap.is(":visible") && $(e.target).closest('.favorites-reaction-total-wrapper').length == 0) {
         $favorites_wrap.hide();
      }
    });
    $search_input.addClass('Searchbar-textInput search');
    $search_input.css({'max-width':'180px'});
    $favorites_wrap.append($search_input);
    $search_input.on('input',(e) => {
       let query = $search_input.val().trim().toLowerCase();

       if($favorites_wrap.find('.favorite-folders-wrap').is(':visible')) {
           let $folders = $favorites_wrap.find('.get_favorites_by_folder');
           $folders.show();
           if(query.length > 0) {
             $folders.each((i,folder) => {
               let $folder = $(folder);
               let data =  $folder.data('favorite-folder');

               if(data.name.toLowerCase().indexOf(query) == -1) {
                  $folder.hide();
               }
             });
           }
       }
       else {
        
           if($favorites_wrap.find('.folder-contents-wrap').is(':visible')) {
              
              let $reactions = $favorites_wrap.find('.folder-content-reaction');
              $reactions.show();
              
              if(query.length > 0) {
                 $reactions.each((i, reaction) => {
                     let $reaction = $(reaction);
                     let data = $reaction.data('image-data'); 
                     
                     if(!(
                        (data.title && data.title.toLowerCase().indexOf(query) != -1) ||
                        (data.description && data.description.toLowerCase().indexOf(query) != -1) ||
                        (data.tags && data.tags.length && data.tags.join(' ').toLowerCase().indexOf(query) != -1)
                        )) {
                        $reaction.hide();
                     }
                 })
              }
           }
       }
    });
    $favorites_wrap.hide();
    
    var loadFavorites = () => {
       // hijacking the imgur way of sending stuff
       window.fetch('https://api.imgur.com/3/folders',{
            credentials: "include"
        }).then((response) => {
           if(response.status == 200) {
               response.json().then((jsonPromise) => {
                  let data = jsonPromise.data;
                  // Emulate android app folders behaviour in sorting
                  data.sort((a,b) => {
                     return b.id - a.id;
                  });
                  let $wrap = $('<div>');
                  $.each(data, (index, item) => {
                     
                     let $row = $('<div>'); 
                     $row.css({'cursor':'pointer'});
                     $row.addClass('get_favorites_by_folder');
                     let $icon = $('<img src="'+DEFAULT_FOLDER_ICON+'">');
                     if(item.cover_hash) {
                         $icon = $('<div>');
                         $icon.css({'background-size': '50px 30px', 'background-repeat':'no-repeat',margin:'3px', display: 'inline-block', 'background-image': 'url(https://i.imgur.com/'+item.cover_hash+'s.png)'});
                         $icon.css(CSS_CLIP_PATH);
                     }
                     $icon.css({'width':'50px','height':'30px'});
                     $row.append($icon);
                     $row.append(item.name);
                     $wrap.append($row); 
                     $row.data('favorite-folder', item);
                  });
                  $wrap.addClass('favorite-folders-wrap');
                  $favorites_wrap.find(".favorite-folders-wrap").remove();
                  $favorites_wrap.append($wrap);
               });
           }
        })
    }
    $(document).on('blur', '.caption-create textarea', (e) => {
        if($favorites_wrap.is(':visible')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    $(document).on('click','.open_favorites', (e) => {
        
        if(call_favorites_once) {
           call_favorites_once = false;
           loadFavorites();
        }
        
        
    	let $target = $(e.target);
        $current_comment_box = $target.closest('.comment').find('.caption-create');
        $favorites_wrap.show();
        $favorites_wrap.css({top: $target.offset().top+'px', left: $target.offset().left+'px'});
        e.originalEvent.skipTheClosingAction = true;
        e.preventDefault();
        e.stopPropagation();
        return false;

    });

    $(document).on('click', '.folder-content-reaction', (e) => {
       var $target = $(e.target);
       var data = $target.data('image-data');
       var textareas = $current_comment_box.find('textarea');
       var value = textareas.val();
       textareas.val(value + ' ' + data.link + ' ');
       textareas.trigger('input change');
       $favorites_wrap.hide();
       e.preventDefault();
       e.stopPropagation();
       return false;
    });
    let add_favorite_button = ($creation) => {
       let $gif_container = $creation.find('.summary .comment-gif-container');
        if($gif_container.find('.open_favorites').length == 0) {

            let $favorites = $('<button class="open_favorites post-action-icon post-action-favorite icon-favorite-outline" style="transform: scale(1);"></button>');

            $gif_container.find('button[original-title="Add reaction GIF"]').css({'margin-right':'0px'});
            $gif_container.append($favorites);
        }
    };
  
    $(document).on('hover, focus', '.root-caption-container > .caption-create', (e) => {
        add_favorite_button($(e.target));
    })
	$(document).on('click','.comment-create-reply', (e) => {
        // detach from event flow, let react do it's thing first
        // for who doesn't understand, javascript is basically single threaded.
        // so events are handled beofre stuff happens sometimes.
        // In this case our events are too early and react hasn't had time to attach
        // the comment box to the DOM tree yet.
        // So in order to find the comment box, we need to step back our script, and let the
        // "normal" execution continue, and then we continue with our flow, taking
        // advantage of javascript scopes, to keep track of where was clicked.
        window.setTimeout(() => {
            let $creation = $(e.target).closest('.comment').find('.caption-create');
            add_favorite_button($creation);
            
        },50);
        e.preventDefault();
       e.stopPropagation();
       return false;
    });  
}(jQuery, Imgur.Environment.apiClientId)
