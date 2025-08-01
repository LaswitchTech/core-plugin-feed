builder.add('components','feed', class extends builder.ComponentClass {

    #count = 0;
    _posts = {};
    _controls = {};

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            iframed: false,
            callback: {},
        };
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'feed' + this._id,
            'class': 'feed',
        });
        this._component.id = this._component.attr('id');

        // Set Component Class
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }
    }

    control(label, icon = 'circle', callback = null){
        this._controls[label] = {
            label: label,
            icon: icon,
            callback: callback,
        };
    }

    add(data, param1 = null, param2 = null){

        // Set Self
        const self = this;

        let options = {};
        let callback = null;

        // Set selector, options, and callback
        [param1, param2].forEach(param => {
            if(param !== null){
                if (typeof param === 'object') {
                    options = param;
                } else if (typeof param === 'function') {
                    callback = param;
                }
            }
        });

        let properties = {};

        // Configure Options
        for(const [key, value] of Object.entries(this._properties)){
            if(typeof properties[key] === 'undefined'){
                properties[key] = value;
            }
        }
        for(const [key, value] of Object.entries(options)){
            if(typeof properties[key] !== 'undefined'){
                switch(key){
                    case"callback":
                        if(typeof properties[key] !== 'undefined'){
                            for(const [k, v] of Object.entries(value)){
                                if(typeof properties[key][k] !== 'undefined'){
                                    properties[key][k] = v;
                                }
                            }
                        }
                        break;
                    case"class":
                        for(const [section, classes] of Object.entries(value)){
                            if(properties[key][section] != null){
                                properties[key][section] += ' ' + classes;
                            } else {
                                properties[key][section] = classes;
                            }
                        }
                        break;
                    default:
                        properties[key] = value;
                        break;
                }
            }
        }

        // Increment Post Count
        this.#count++;

        // Generate Post ID
        const id = data.id ?? this.#count;
        const postId = 'post' + id;

        // Create Post
        var post = $(document.createElement('div')).attr({
            'id': postId,
            'class': 'post',
        }).appendTo(this._component);

        // Set Post ID
        post.id = post.attr('id');

        // Create Title Block
        post.header = $(document.createElement('div')).addClass('title').appendTo(post);
        post.header.title = $(document.createElement('h2')).addClass('title').text(data.title ?? '').appendTo(post.header);

        // Create User Block
        post.owner = $(document.createElement('div')).addClass('owner').appendTo(post);
        post.owner.avatar = $(document.createElement('img')).attr({
            'class': 'avatar',
            'alt': 'Avatar',
            'src': data.avatar ?? '/avatar?username=' + (data.owner ?? 'anonymous')
        }).appendTo(post.owner);
        post.owner.meta = $(document.createElement('div')).addClass('meta').appendTo(post.owner);
        post.owner.meta.username = $(document.createElement('a')).attr({
            'class': 'username',
            'href': data.profileUrl ?? '/profile'
        }).text(data.owner ?? 'anonymous').appendTo(post.owner.meta);
        post.owner.meta.metadata = $(document.createElement('div')).addClass('metadata').appendTo(post.owner.meta);
        post.owner.meta.metadata.icon = $(document.createElement('i')).addClass('bi bi-clock me-1').appendTo(post.owner.meta.metadata);
        post.owner.meta.metadata.timeago = $(document.createElement('time')).attr({
            'class': 'timeago',
            'datetime': data.created ?? new Date().toISOString(),
        }).appendTo(post.owner.meta.metadata);
        const created = new Date(data.created ?? new Date().toISOString());
        post.owner.meta.metadata.timeago.attr({
            'title': created.toLocaleString(),
            'data-bs-toggle': 'tooltip',
            'data-bs-title': created.toLocaleString(),
        });
        new bootstrap.Tooltip(post.owner.meta.metadata.timeago);
        post.owner.meta.metadata.timeago.timeago();
        post.owner.meta.metadata.edited = $(document.createElement('span')).attr({
            'class': 'badge bg-secondary ms-1',
            'data-bs-toggle': 'tooltip',
            'data-bs-title': data.modified ? new Date(data.modified).toLocaleString() : '',
        }).text(data.created !== data.modified ? this._builder.Locale.get('Modified') : '').appendTo(post.owner.meta.metadata);
        new bootstrap.Tooltip(post.owner.meta.metadata.edited)

        // Create Content Block
        if(this._properties.iframed){

            // Create Iframe Block
            post.content = $(document.createElement('iframe')).attr({
                'class': 'content w-100 border-0 bg-transparent',
                'allowtransparency': 'true',
                'frameborder': '0',
                'style': 'background-color: transparent !important;'
            }).appendTo(post);

            // Set the iframe to load before injecting content
            post.content.on('load', function() {

            // Check if properties.content is not null
            if (data.content != null) {

                // Access the iframe's document object
                var iframeDocument = post.content[0].contentDocument || post.content[0].contentWindow.document;

                // Write the content into the iframe
                iframeDocument.open();
                iframeDocument.write(`
                    <style>
                        html, body { background-color: transparent!important; margin: 0; padding: 0; scroll-behavior: smooth; }
                        body { padding: 1rem; }
                    </style>
                    ${data.content}
                `);
                iframeDocument.close();
            }
            });
        } else {
            post.content = $(document.createElement('p')).attr({
                'class': 'content',
            }).html(data.content ?? '').appendTo(post);
        }

        // Create More Block
        post.more = $(document.createElement('div')).addClass('more').appendTo(post);
        post.more.button = $(document.createElement('button')).attr({
            'type': 'button',
            'class': 'btn btn-sm btn-outline-primary',
        }).text(this._builder.Locale.get('Show more')).appendTo(post.more);
        post.more.button.on('click', function(e){
            e.preventDefault();
            if(post.content.hasClass('expanded')){
                post.content.removeClass('expanded');
                post.more.button.text(self._builder.Locale.get('Show more'));
            } else {
                post.content.addClass('expanded');
                post.more.button.text(self._builder.Locale.get('Show less'));
            }
        });

        // Create an event listener on the post content to toggle the visibility of the more block.
        post.content.on('DOMSubtreeModified', function() {
            if(post.content[0].scrollHeight > 250){
                post.more.show();
            } else {
                post.more.hide();
            }
        });

        // Create Controls Block
        post.controls = $(document.createElement('p')).addClass('controls').appendTo(post);
        for(const [label, control] of Object.entries(this._controls)){
            post.controls[label] = $(document.createElement('button')).attr({
                'class': 'btn btn-sm btn-link',
                'type': 'button',
            }).text(self._builder.Locale.get(label)).prepend('<i class="bi me-1 bi-'+control.icon+'"></i>').appendTo(post.controls);
            if(typeof control.callback === 'function'){
                post.controls[label].on('click', function(e){
                    e.preventDefault();
                    control.callback.call(self, data, post);
                });
            }
        }

        // Trigger Callback
        if(typeof callback === 'function'){
            callback(this, data, post);
        }

        // Trigger the event to check the content height
        post.content.trigger('DOMSubtreeModified');

        // Set Search
        this._builder.Search.set(post)

        // Add Post to Collection
        this._posts[id] = post;

        // Return Self
        return this;
    }
});
