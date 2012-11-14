/*!
 * jQuery Polling Plugin v0.1
 * https://github.com/riga/jquery.polling
 *
 * Copyright 2012, Marcel Rieger
 * Dual licensed under the MIT or GPL Version 3 licenses.
 * http://www.opensource.org/licenses/mit-license
 * http://www.opensource.org/licenses/GPL-3.0
 */

var _polling = {};

jQuery.Polling = function( /*String|Integer*/ id ) {
	
	var self = id && _polling[ id ];
	
	if ( !self ) {
		// callbacks store
		var _callbacks = [],
		
		// notification store
		_notifications = jQuery.Callbacks(),
		
		// default config
		_config = {
			autoRun: false,
			delay: 5000,
			cycles: -1,
			end: jQuery.Callbacks()
		},
		
		// run and lock vars
		_counter = 0,
		_isRunning = false,
		_timeout = null,
		_isLocked = false,
		_doLock = false,
		_lockDeferred = jQuery.Deferred(),
		
		// setup function
		setup = function( /*Object*/ __config ) {
			jQuery.extend( true, _config, __config );
			return this;
		},
		
		// add function
		add = function() {
			if ( arguments.length > 0 ) {
				_callbacks = jQuery.merge( _callbacks, arguments );
				// autorun?
				if ( _config.autoRun ) {
					run();
				}
			}
			return this;
		},
		
		// run function
		run = function() {
			window.clearTimeout( _timeout );
			if (!_isLocked) {
				_isRunning = true;
				var promises = [];
				jQuery.each(_callbacks, function( i, callback ) {
					var result = callback();
					promises.push( (result && result.promise) ? result.promise() : result );
				});
				
				_counter++;
				if ( _config.cycles > -1 && _counter >= _config.cycles ) {
					lock( _config.end.fire || _config.end );
				}
				
				jQuery.when.apply( null, promises ).then(function() {
					_notifications.fire.apply( _notifications, promises );
					if ( _doLock ) {
						_lockDeferred.resolve();
					} else {
						_timeout = window.setTimeout( run, _config.delay );
					}
				});
			}
			return this;
		},
		
		// remove function
		remove = function() {
			var args = jQuery.makeArray( arguments );
			var dfd = jQuery.Deferred().done(function () {
				_callbacks = jQuery.grep( _callbacks, function( callback ) {
					return jQuery.inArray( callback, args ) == -1;
				});
				unlock();
			});
			lock( dfd.resolve );
			return this;
		},
		
		// empty function
		empty = function() {
			var dfd = jQuery.Deferred().done(function() {
				_callbacks = [];
				unlock();
			});
			lock( dfd.resolve );
			return this;
		},
		
		// lock function
		lock = function( /*Function|jQuery.Callbacks*/ callback ) {
			callback = callback.fire || callback;
			if ( !_isRunning || _timeout ) {
				window.clearTimeout( _timeout );
				_isRunning = false;
				_isLocked = true;
				callback();
			} else {
				_lockDeferred = jQuery.Deferred().done(function() {
					_isLocked = true;
					_doLock = _isRunning = false;
				}, callback);
				_doLock = true;
			}
			return this;
		},
		
		// onlock functiou
		unlock = function( /*Boolean*/ resetCounter ) {
			_counter = resetCounter ? 0 : _counter;
			_doLock = false;
			if ( _isLocked ) {
				_isLocked = false;
				run();
			}
			return this;
		},
		
		// notify function
		notify = function() {
			_notifications.add( jQuery.makeArray( arguments ) );
			return this;
		},
		
		// disnotify function
		disnotify = function() {
			_notifications.remove( jQuery.makeArray( arguments ) );
			return this;
		},
		
		// emptyNotify function
		emptyNotify = function() {
			_notifications.empty();
			return this;
		},
		
		// _callbacks getter
		callbacks = function() {
			return _callbacks;
		},
		
		// _notifications getter
		notifications = function() {
			return _notifications;
		},
		
		// _config getter
		config = function() {
			return _config;
		},
		
		// _counter getter
		count = function() {
			return _counter;
		},
		
		// _isLocked getter
		locked = function() {
			return _isLocked;
		},
		
		// _isRunning getter
		running = function() {
			return _isRunning;
		};
		
		self = {
			// functions
			setup: setup,
			add: add,
			run: run,
			remove: remove,
			empty: empty,
			lock: lock,
			unlock: unlock,
			notify: notify,
			disnotify: disnotify,
			emptyNotify: emptyNotify,
			// getter
			callbacks: callbacks,
			notifications: notifications,
			config: config,
			count: count,
			locked: locked,
			running: running
		};
		
		if ( id ) {
			_polling[ id ] = self;
		}
	}
	
	return self;
};