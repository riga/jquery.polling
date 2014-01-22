/*!
 * jQuery Polling Plugin v0.3.1
 * https://github.com/riga/jquery.polling
 *
 * Copyright 2014, Marcel Rieger
 * Dual licensed under the MIT or GPL Version 3 licenses.
 * http://www.opensource.org/licenses/mit-license
 * http://www.opensource.org/licenses/GPL-3.0
 */

(function(window, $) {
  var _polling = {};

  $.Polling = function(id) {

    var self = id && _polling[id];

    if (!self) {
      // callbacks store
      var _callbacks = [],

      // notification store
      _notifications = $.Callbacks(),

      // default config
      _config = {
        autoRun: false,
        delay: 5000,
        cycles: -1,
        end: $.Callbacks()
      },

      // run and lock vars
      _counter = 0,
      _isRunning = false,
      _timeout = null,
      _isLocked = false,
      _doLock = false,
      _lockDeferred = $.Deferred(),

      // setup function
      setup = function(__config) {
        $.extend(true, _config, __config);
        return this;
      },

      // add function
      add = function() {
        var args = $.makeArray(arguments);
        if (args.length) {
          _callbacks = $.merge(_callbacks, args);
          // autorun?
          if (_config.autoRun)
            run();
        }
        return this;
      },

      // run function
      run = function() {
        window.clearTimeout(_timeout);
        if (!_isLocked) {
          _isRunning = true;
          var promises = [];
          $.each(_callbacks, function(i, callback) {
            var result = callback();
            promises.push((result && result.promise) ? result.promise() : result);
          });

          _counter++;
          if (_config.cycles > -1 && _counter >= _config.cycles)
            lock(_config.end.fire || _config.end);

          $.when.apply(null, promises).then(function() {
            _notifications.fire.apply(_notifications, promises);
            if (_doLock)
              _lockDeferred.resolve();
            else
              _timeout = window.setTimeout(run, _config.delay);
          });
        }
        return this;
      },

      // remove function
      remove = function() {
        var args = $.makeArray(arguments);
        var dfd = $.Deferred().done(function() {
          _callbacks = $.grep(_callbacks, function(callback) {
            return $.inArray(callback, args) == -1;
          });
          unlock();
        });
        lock(dfd.resolve);
        return this;
      },

      // empty function
      empty = function() {
        var dfd = $.Deferred().done(function() {
          _callbacks = [];
          unlock();
        });
        lock(dfd.resolve);
        return this;
      },

      // lock function
      lock = function(callback) {
        callback = callback || function(){};
        callback = callback.fire || callback;
        if (!_isRunning || _timeout) {
          window.clearTimeout(_timeout);
          _isRunning = false;
          _isLocked = true;
          callback();
        } else {
          _lockDeferred = $.Deferred().done(function() {
            _isLocked = true;
            _doLock = _isRunning = false;
          }, callback);
          _doLock = true;
        }
        return this;
      },

      // unlock function
      unlock = function(resetCounter) {
        _counter = resetCounter ? 0 : _counter;
        _doLock = false;
        if (_isLocked) {
          _isLocked = false;
          run();
        }
        return this;
      },

      // notify function
      notify = function() {
        _notifications.add($.makeArray(arguments));
        return this;
      },

      // disnotify function
      disnotify = function() {
        _notifications.remove($.makeArray(arguments));
        return this;
      },

      // emptyNotifications function
      emptyNotifications = function() {
        _notifications.empty();
        return this;
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
        setup: setup,
        add: add,
        run: run,
        remove: remove,
        empty: empty,
        lock: lock,
        unlock: unlock,
        notify: notify,
        disnotify: disnotify,
        emptyNotifications: emptyNotifications,
        count: count,
        locked: locked,
        running: running
      };

      if (id)
        _polling[id] = self;
    }

    return self;
  };
})(window, jQuery);
