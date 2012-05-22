NEWSBLUR.Views.Feed = Backbone.View.extend({
    
    options: {
        depth: 0,
        selected: false
    },
    
    events: {
        "contextmenu"                    : "show_manage_menu",
        "click .NB-feedlist-manage-icon" : "show_manage_menu",
        "click"                          : "open",
        "mouseenter"                     : "add_hover_inverse_to_feed",
        "mouseleave"                     : "remove_hover_inverse_from_feed"
    },
    
    initialize: function() {
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
    },
    
    destroy: function() {
        this.remove();
        this.model.unbind('change', this.render);
    },
    
    render: function(model, options) {
        var feed = this.model;
        var unread_class = '';
        var exception_class = '';
        var empty_on_missing = !NEWSBLUR.reader.flags['showing_feed_in_tryfeed_view'] &&
                               !NEWSBLUR.reader.flags['showing_social_feed_in_tryfeed_view'];
        if (feed.is_social() && !feed.get('feed_title')) {
            var profile = NEWSBLUR.assets.user_profiles.get(feed.get('user_id')) || {};
            feed.set('feed_title', profile.feed_title);
        }
        if (feed.get('ps')) {
            unread_class += ' unread_positive';
        }
        if (feed.get('nt')) {
            unread_class += ' unread_neutral';
        }
        if (feed.get('ng')) {
            unread_class += ' unread_negative';
        }
        if (feed.get('has_exception') && feed.get('exception_type') == 'feed') {
            exception_class += ' NB-feed-exception';
        }
        if (feed.get('not_yet_fetched') && !feed.get('has_exception')) {
            exception_class += ' NB-feed-unfetched';
        }
        if (!feed.get('active') && !feed.get('subscription_user_id')) {
            exception_class += ' NB-feed-inactive';
        }
        if (feed.get('subscription_user_id') && !feed.get('shared_stories_count')) {
            unread_class += ' NB-feed-inactive';
        }
        var $feed = $(_.template('\
        <<%= list_type %> class="feed <% if (selected) { %>selected<% } %> <%= unread_class %> <%= exception_class %> <% if (toplevel) { %>NB-toplevel<% } %>" data-id="<%= feed.id %>">\
          <div class="feed_counts">\
            <%= feed_counts_floater %>\
          </div>\
          <img class="feed_favicon" src="<%= $.favicon(feed) %>">\
          <span class="feed_title">\
            <%= feed.get("feed_title") %>\
            <% if (type == "story") { %>\
              <span class="NB-feedbar-train-feed" title="Train Intelligence"></span>\
              <span class="NB-feedbar-statistics" title="Statistics"></span>\
            <% } %>\
          </span>\
          <% if (type == "story") { %>\
            <div class="NB-feedbar-last-updated">\
              <span class="NB-feedbar-last-updated-label">Updated:</span>\
              <span class="NB-feedbar-last-updated-date">\
                <% if (feed.get("updated")) { %>\
                  <%= feed.get("updated") %> ago\
                <% } else { %>\
                  Loading...\
                <% } %>\
              </span>\
            </div>\
            <div class="NB-feedbar-mark-feed-read">Mark All as Read</div>\
          <% } %>\
          <div class="NB-feed-exception-icon"></div>\
          <div class="NB-feed-unfetched-icon"></div>\
          <div class="NB-feedlist-manage-icon"></div>\
          <div class="NB-feed-highlight"></div>\
        </<%= list_type %>>\
        ', {
          feed                : feed,
          type                : this.options.type,
          feed_counts_floater : new NEWSBLUR.Views.FeedCount({model: feed}).render_to_string(),
          unread_class        : unread_class,
          exception_class     : exception_class,
          toplevel            : this.options.depth == 0,
          list_type           : this.options.type == 'feed' ? 'li' : 'div',
          empty_on_missing    : empty_on_missing,
          selected            : this.model.get('selected') || NEWSBLUR.reader.active_feed == this.model.id
        }));
        
        this.$el.replaceWith($feed);
        this.setElement($feed);
        
        if (options && options.changes &&
            (options.changes.ps || options.changes.nt || options.changes.ng)) {
            this.alert_changes_to_feed();
        }
        return this;
    },
    
    alert_changes_to_feed: function() {
        var $highlight = this.$('.NB-feed-highlight');
        console.log(["update", $highlight, this.el]);
        $highlight.css({
            'backgroundColor': '#F0F076',
            'display': 'block'
        });
        $highlight.animate({
            'opacity': .7
        }, {
            'duration': 800, 
            'queue': false, 
            'complete': function() {
                $highlight.animate({'opacity': 0}, {
                    'duration': 1000, 
                    'queue': false,
                    'complete': function() {
                        $highlight.css('display', 'none');
                    }
                });
            }
        });
    },
    
    add_hover_inverse_to_feed: function() {
        if (NEWSBLUR.app.feed_list.is_sorting()) {
            return;
        }

        if (this.$el.offset().top > $(window).height() - 314) {
            this.$el.addClass('NB-hover-inverse');
        } 
    },
    
    remove_hover_inverse_from_feed: function() {
        this.$el.removeClass('NB-hover-inverse');
    },
    
    // ==========
    // = Events =
    // ==========
    
    open: function(e) {
        if (NEWSBLUR.hotkeys.command) {
            NEWSBLUR.reader.open_unread_stories_in_tabs(this.id);
        } else if (this.model.is_social()) {
            NEWSBLUR.reader.open_social_stories(this.model.id, {force: true, $feed_link: this.$el});
        } else {
            NEWSBLUR.reader.open_feed(this.model.id, {$feed_link: this.$el});
        }
    },
    
    show_manage_menu: function(e) {
        e.preventDefault();
        e.stopPropagation();
        // console.log(["showing manage menu", this.model.is_social() ? 'socialfeed' : 'feed', $(this.el), this]);
        NEWSBLUR.reader.show_manage_menu(this.model.is_social() ? 'socialfeed' : 'feed', $(this.el), {
            feed_id: this.model.id,
            toplevel: this.options.depth == 0
        });
        return false;
    }

});