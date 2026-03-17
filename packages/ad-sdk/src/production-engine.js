/**
 * ScrollToday Production Ad Engine
 * 
 * Based on the advanced Airtory delivery script. 
 * This file is meant to be parameterized at publish time. The bundler will replace:
 * - %%AD_JS_DATA%% with the JSON configuration of the creative
 * - %%TRACKING_BASE_URL%% with the production Supabase endpoint (e.g., /functions/v1/track-event)
 * - %%FORMAT_RENDER_LOGIC%% with the specific format's JS (Flipcard, Cube, etc.)
 */

(function () {
  'use strict';

  /** Defining tracker variables **/
  var cflag = true, lrt, lmc = 40, llc = 23, adViewFlag = true, uniqUserEngagement_ = false;

  /** Assigning default macro params if not defined **/
  if (typeof (window._stAdParams) == "undefined") {
      if (typeof (params) == "undefined") {
          window._stAdParams = {
              click_url: "no_macro",
              cachebuster: +new Date(),
              deviceid: ""
          };
      } else {
          window._stAdParams = params;
      }
  }

  /**
   * Returns true if all window elements through to the window.top contain the InDapf var.
   */
  var isIframeIABFriendly = function (tagWindow) {
      var curw = tagWindow;
      var isIt = true;
      do {
          try { isIt = curw.inDapIF || false; } catch (error) { isIt = false; }
          if (curw === curw.parent) break;
          curw = curw.parent;
      } while (curw !== window.top);
      return isIt;
  };

  var windowIsMobileOptimized = function (__window) {
      try { return __window.document.head.querySelector('meta[name=viewport][content*=width]') ? true : false; } 
      catch (error) { return null; }
  };

  var findPlacementsInElement = function (parentWindow) {
      var ads = [];
      try {
          var parentElem = parentWindow.document;
          var candidates = parentElem.querySelectorAll('* > iframe');
          Object.keys(candidates).forEach(function (k) {
              if (candidates[k].offsetWidth > 290 && candidates[k].offsetHeight > 40) {
                  ads.push(candidates[k]);
              }
          });
      } catch (error) {}
      return ads;
  };

  var getReferrer = function (Case) {
      if (Case === void 0) { Case = 1; }
      var referrer;
      try {
          if (Case == 1) { referrer = window.top.location.hostname; }
          else if (Case == 2) { var ancestorOrigins = window.location.ancestorOrigins; referrer = ancestorOrigins[ancestorOrigins.length - 1]; }
          else if (Case == 3) { referrer = document.referrer; }
          else if (Case == 4) { referrer = ""; }
      } catch (er) {
          Case += 1;
          referrer = getReferrer(Case);
      }
      return referrer;
  };

  var impressionParams = "&hostile-frame=true";
  if (isIframeIABFriendly(window)) {
      impressionParams = "&hostile-frame=false"
          + "&mobile-optimized=" + windowIsMobileOptimized(window.top)
          + "&ad-density=" + findPlacementsInElement(window.top).length;
  }

  if (!window._stAdParams.referral) {
      window._stAdParams.referral = getReferrer();
  }

  // =======================================================================
  // INJECTED CONFIGURATION (Replaced by Bundler)
  // =======================================================================
  var adJsData = %%AD_JS_DATA%%;
  var trackBaseUrl = '%%TRACKING_BASE_URL%%';
  var data = Object.assign({}, adJsData);

  // Fallback requestId if not provided
  if (!data.requestId) {
    data.requestId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
  }

  // =======================================================================
  // MRAID & ENVIRONMENT DETECTION
  // =======================================================================
  if (typeof (window.mraid) == "undefined") {
      window.mraid = {
          close: function () {
              try { frameElement.style.cssText = mraid.defaultCss; } catch (e) {}
              mraid.state = "default";
              mraid.stateChange && (mraid.stateChange('default'));
          },
          expand: function () {
              if (mraid.state == "expanded") return;
              mraid.state = "expanded";
              mraid.stateChange && (mraid.stateChange('expanded'));
              mraid.defaultCss = "";
              try { mraid.defaultCss = frameElement.style.cssText; } catch (e) {}
          },
          addEventListener: function (event, listener) { mraid[event] = listener; },
          getState: function () { return mraid.state; },
          state: "default",
          open: function (url) { window.open(url, "_blank"); }
      };
  }

  function serialize(obj, prefix) {
      var str = [], p;
      for (p in obj) {
          if (obj.hasOwnProperty(p)) {
              var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
              str.push((v !== null && typeof v === "object") ? serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
          }
      }
      return str.join("&");
  }

  var pixelParams = "&rid=" + data.requestId + "&cid=" + data.id + "&aid=" + data.advertiserId + (data.campaignId ? "&cmpid=" + data.campaignId : "");
  try {
      var adParams = JSON.parse(JSON.stringify(window._stAdParams));
      delete adParams.impression;
      delete adParams.click_url;
      pixelParams += "&" + serialize(adParams);
  } catch (er) {
      pixelParams += "&cb=" + Date.now();
  }

  // =======================================================================
  // TELEMETRY QUEUE
  // =======================================================================
  var viewability = window.viewability || { track: { q: [] } };
  var telemetry = window.telemetry || { track: { q: [] }, http: { q: [] }, pixel: { q: [] } };

  // =======================================================================
  // TRACKING METHODS
  // =======================================================================
  function track(obj, query, userInitiated) {
      if (query === void 0) { query = ""; }
      if (userInitiated === void 0) { userInitiated = true; }
      
      var eventParams = "?cb=" + (+new Date()) + query + pixelParams;
      
      for (var el in obj) {
          if (el) {
              var tracker = new Image();
              // obj[el] is usually the creativeId, el is the event type (e.g. 'flip')
              tracker.src = trackBaseUrl + "?type=" + encodeURIComponent(el) + eventParams;
              tracker.style.cssText = 'position:absolute;display:none;';
              document.body.appendChild(tracker);
          }
      }

      // Automatically fire generic 'engagement' if this is the first interaction
      if (userInitiated && !uniqUserEngagement_) {
          uniqUserEngagement_ = true;
          var engTracker = new Image();
          engTracker.src = trackBaseUrl + "?type=engagement" + eventParams + "&engagement_type=" + encodeURIComponent(Object.keys(obj)[0]);
          engTracker.style.cssText = 'position:absolute;display:none;';
          document.body.appendChild(engTracker);
      }
  }

  function pixel(obj) {
      for (var el in obj) {
          if (el) {
              var p = new Image();
              p.src = trackBaseUrl + "?type=" + encodeURIComponent(el) + pixelParams + "&cb=" + Date.now();
              p.style.cssText = 'position:absolute;display:none;';
              document.body.appendChild(p);

              if (el === 'impression_served') {
                  // Setup viewability after impression
                  setupViewability();
              }
          }
      }
  }

  function setupViewability() {
      if (typeof IntersectionObserver === 'undefined') return;
      var fired = false;
      var viewTimer = null;
      var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
              if (fired) return;
              if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                  if (!viewTimer) {
                      viewTimer = setTimeout(function() {
                          if (!fired) {
                              fired = true;
                              pixel({ 'impression_viewable': data.id });
                              observer.disconnect();
                          }
                      }, 1000);
                  }
              } else {
                  if (viewTimer) { clearTimeout(viewTimer); viewTimer = null; }
              }
          });
      }, { threshold: 0.5 });
      observer.observe(document.body);
  }

  // =======================================================================
  // FORMAT RENDER LOGIC (Injected by Bundler)
  // =======================================================================
  function renderCreative() {
      // Expose tracking to the format logic
      window.ScrollTodaySDK = {
          track: function(eventType, extraData) {
              var payload = {};
              payload[eventType] = data.id;
              var query = "";
              if (extraData) {
                  query = "&" + serialize(extraData);
              }
              track(payload, query, true);
          }
      };

      // Create a mount point if it doesn't exist
      var root = document.getElementById('creative-root');
      if (!root) {
          root = document.createElement('div');
          root.id = 'creative-root';
          root.style.cssText = 'width: 100%; height: 100%; overflow: hidden; position: relative;';
          document.body.appendChild(root);
          document.body.style.margin = '0';
          document.body.style.padding = '0';
      }

      // Inject format CSS
      var style = document.createElement('style');
      style.textContent = `%%FORMAT_CSS%%`;
      document.head.appendChild(style);

      // Execute format JS
      try {
          %%FORMAT_RENDER_LOGIC%%
          // The format logic is expected to define a function that takes (root, config)
          // We call it based on the bundler's injection.
          if (typeof window[data._functionName] === 'function') {
              window[data._functionName](root, data);
          }
      } catch (e) {
          console.error("Format render error:", e);
      }
  }

  // =======================================================================
  // INITIALIZATION
  // =======================================================================
  function init() {
      renderCreative();
      pixel({ 'impression_served': data.id });
      
      // Start Dwell Heartbeat (Presence)
      setInterval(function() {
          if (!document.hidden) {
              var p = new Image();
              p.src = trackBaseUrl + "?type=presence&dwell_time_ms=5000" + pixelParams + "&cb=" + Date.now();
              p.style.cssText = 'position:absolute;display:none;';
              document.body.appendChild(p);
          }
      }, 5000);
  }

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      init();
  }

})();
