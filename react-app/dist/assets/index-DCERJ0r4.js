import{r as u,a as ni,u as Js,N as Kt,O as Gt,b as cs,d as Jt,e as ii,f as Ys,L as tt,h as ri,i as z,B as ai}from"./vendor-BhYwIHws.js";import{R as st,A as oi,C as bt,X as yt,Y as xt,T as Nt,a as ds,B as us,b as hs,c as ot,P as li,d as ci}from"./recharts-CmuVPVrg.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();var Xs={exports:{}},ft={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var di=u,ui=Symbol.for("react.element"),hi=Symbol.for("react.fragment"),mi=Object.prototype.hasOwnProperty,pi=di.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,fi={key:!0,ref:!0,__self:!0,__source:!0};function Qs(s,e,t){var i,r={},a=null,o=null;t!==void 0&&(a=""+t),e.key!==void 0&&(a=""+e.key),e.ref!==void 0&&(o=e.ref);for(i in e)mi.call(e,i)&&!fi.hasOwnProperty(i)&&(r[i]=e[i]);if(s&&s.defaultProps)for(i in e=s.defaultProps,e)r[i]===void 0&&(r[i]=e[i]);return{$$typeof:ui,type:s,key:a,ref:o,props:r,_owner:pi.current}}ft.Fragment=hi;ft.jsx=Qs;ft.jsxs=Qs;Xs.exports=ft;var n=Xs.exports,Zs,ms=ni;Zs=ms.createRoot,ms.hydrateRoot;const en=u.createContext({isDark:!1,toggleTheme:()=>{}});function gi({children:s}){const[e,t]=u.useState(()=>{const r=localStorage.getItem("theme");return r==="dark"?!0:r==="light"?!1:window.matchMedia("(prefers-color-scheme: dark)").matches});u.useEffect(()=>{e?document.documentElement.setAttribute("data-theme","dark"):document.documentElement.removeAttribute("data-theme")},[e]),u.useEffect(()=>{const r=window.matchMedia("(prefers-color-scheme: dark)"),a=o=>{localStorage.getItem("theme")||t(o.matches)};return r.addEventListener("change",a),()=>r.removeEventListener("change",a)},[]);const i=()=>{t(r=>{const a=!r;return localStorage.setItem("theme",a?"dark":"light"),a})};return n.jsx(en.Provider,{value:{isDark:e,toggleTheme:i},children:s})}const Yt=()=>u.useContext(en);var ps={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tn=function(s){const e=[];let t=0;for(let i=0;i<s.length;i++){let r=s.charCodeAt(i);r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):(r&64512)===55296&&i+1<s.length&&(s.charCodeAt(i+1)&64512)===56320?(r=65536+((r&1023)<<10)+(s.charCodeAt(++i)&1023),e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},_i=function(s){const e=[];let t=0,i=0;for(;t<s.length;){const r=s[t++];if(r<128)e[i++]=String.fromCharCode(r);else if(r>191&&r<224){const a=s[t++];e[i++]=String.fromCharCode((r&31)<<6|a&63)}else if(r>239&&r<365){const a=s[t++],o=s[t++],l=s[t++],c=((r&7)<<18|(a&63)<<12|(o&63)<<6|l&63)-65536;e[i++]=String.fromCharCode(55296+(c>>10)),e[i++]=String.fromCharCode(56320+(c&1023))}else{const a=s[t++],o=s[t++];e[i++]=String.fromCharCode((r&15)<<12|(a&63)<<6|o&63)}}return e.join("")},sn={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(s,e){if(!Array.isArray(s))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,i=[];for(let r=0;r<s.length;r+=3){const a=s[r],o=r+1<s.length,l=o?s[r+1]:0,c=r+2<s.length,d=c?s[r+2]:0,_=a>>2,m=(a&3)<<4|l>>4;let w=(l&15)<<2|d>>6,b=d&63;c||(b=64,o||(w=64)),i.push(t[_],t[m],t[w],t[b])}return i.join("")},encodeString(s,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(s):this.encodeByteArray(tn(s),e)},decodeString(s,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(s):_i(this.decodeStringToByteArray(s,e))},decodeStringToByteArray(s,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let r=0;r<s.length;){const a=t[s.charAt(r++)],l=r<s.length?t[s.charAt(r)]:0;++r;const d=r<s.length?t[s.charAt(r)]:64;++r;const m=r<s.length?t[s.charAt(r)]:64;if(++r,a==null||l==null||d==null||m==null)throw new vi;const w=a<<2|l>>4;if(i.push(w),d!==64){const b=l<<4&240|d>>2;if(i.push(b),m!==64){const f=d<<6&192|m;i.push(f)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let s=0;s<this.ENCODED_VALS.length;s++)this.byteToCharMap_[s]=this.ENCODED_VALS.charAt(s),this.charToByteMap_[this.byteToCharMap_[s]]=s,this.byteToCharMapWebSafe_[s]=this.ENCODED_VALS_WEBSAFE.charAt(s),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[s]]=s,s>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(s)]=s,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(s)]=s)}}};class vi extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const bi=function(s){const e=tn(s);return sn.encodeByteArray(e,!0)},nn=function(s){return bi(s).replace(/\./g,"")},rn=function(s){try{return sn.decodeString(s,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yi(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xi=()=>yi().__FIREBASE_DEFAULTS__,Ni=()=>{if(typeof process>"u"||typeof ps>"u")return;const s=ps.__FIREBASE_DEFAULTS__;if(s)return JSON.parse(s)},wi=()=>{if(typeof document>"u")return;let s;try{s=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=s&&rn(s[1]);return e&&JSON.parse(e)},Xt=()=>{try{return xi()||Ni()||wi()}catch(s){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${s}`);return}},ji=s=>{var e,t;return(t=(e=Xt())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[s]},an=()=>{var s;return(s=Xt())===null||s===void 0?void 0:s.config},on=s=>{var e;return(e=Xt())===null||e===void 0?void 0:e[`_${s}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ii{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,i)=>{t?this.reject(t):this.resolve(i),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,i))}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function q(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Ei(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(q())}function Si(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function ki(){const s=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof s=="object"&&s.id!==void 0}function Ci(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Ti(){const s=q();return s.indexOf("MSIE ")>=0||s.indexOf("Trident/")>=0}function Ai(){try{return typeof indexedDB=="object"}catch{return!1}}function Ri(){return new Promise((s,e)=>{try{let t=!0;const i="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(i);r.onsuccess=()=>{r.result.close(),t||self.indexedDB.deleteDatabase(i),s(!0)},r.onupgradeneeded=()=>{t=!1},r.onerror=()=>{var a;e(((a=r.error)===null||a===void 0?void 0:a.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pi="FirebaseError";class ve extends Error{constructor(e,t,i){super(t),this.code=e,this.customData=i,this.name=Pi,Object.setPrototypeOf(this,ve.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,He.prototype.create)}}class He{constructor(e,t,i){this.service=e,this.serviceName=t,this.errors=i}create(e,...t){const i=t[0]||{},r=`${this.service}/${e}`,a=this.errors[e],o=a?Oi(a,i):"Error",l=`${this.serviceName}: ${o} (${r}).`;return new ve(r,l,i)}}function Oi(s,e){return s.replace(Di,(t,i)=>{const r=e[i];return r!=null?String(r):`<${i}?>`})}const Di=/\{\$([^}]+)}/g;function Li(s){for(const e in s)if(Object.prototype.hasOwnProperty.call(s,e))return!1;return!0}function lt(s,e){if(s===e)return!0;const t=Object.keys(s),i=Object.keys(e);for(const r of t){if(!i.includes(r))return!1;const a=s[r],o=e[r];if(fs(a)&&fs(o)){if(!lt(a,o))return!1}else if(a!==o)return!1}for(const r of i)if(!t.includes(r))return!1;return!0}function fs(s){return s!==null&&typeof s=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function We(s){const e=[];for(const[t,i]of Object.entries(s))Array.isArray(i)?i.forEach(r=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(r))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(i));return e.length?"&"+e.join("&"):""}function Me(s){const e={};return s.replace(/^\?/,"").split("&").forEach(i=>{if(i){const[r,a]=i.split("=");e[decodeURIComponent(r)]=decodeURIComponent(a)}}),e}function Ue(s){const e=s.indexOf("?");if(!e)return"";const t=s.indexOf("#",e);return s.substring(e,t>0?t:void 0)}function Mi(s,e){const t=new Ui(s,e);return t.subscribe.bind(t)}class Ui{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(i=>{this.error(i)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,i){let r;if(e===void 0&&t===void 0&&i===void 0)throw new Error("Missing Observer.");Fi(e,["next","error","complete"])?r=e:r={next:e,error:t,complete:i},r.next===void 0&&(r.next=wt),r.error===void 0&&(r.error=wt),r.complete===void 0&&(r.complete=wt);const a=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?r.error(this.finalError):r.complete()}catch{}}),this.observers.push(r),a}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(i){typeof console<"u"&&console.error&&console.error(i)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Fi(s,e){if(typeof s!="object"||s===null)return!1;for(const t of e)if(t in s&&typeof s[t]=="function")return!0;return!1}function wt(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Q(s){return s&&s._delegate?s._delegate:s}class Pe{constructor(e,t,i){this.name=e,this.instanceFactory=t,this.type=i,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ye="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $i{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const i=new Ii;if(this.instancesDeferred.set(t,i),this.isInitialized(t)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:t});r&&i.resolve(r)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const i=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(i)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:i})}catch(a){if(r)return null;throw a}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Vi(e))try{this.getOrInitializeService({instanceIdentifier:ye})}catch{}for(const[t,i]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(t);try{const a=this.getOrInitializeService({instanceIdentifier:r});i.resolve(a)}catch{}}}}clearInstance(e=ye){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=ye){return this.instances.has(e)}getOptions(e=ye){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,i=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(i))throw Error(`${this.name}(${i}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:i,options:t});for(const[a,o]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(a);i===l&&o.resolve(r)}return r}onInit(e,t){var i;const r=this.normalizeInstanceIdentifier(t),a=(i=this.onInitCallbacks.get(r))!==null&&i!==void 0?i:new Set;a.add(e),this.onInitCallbacks.set(r,a);const o=this.instances.get(r);return o&&e(o,r),()=>{a.delete(e)}}invokeOnInitCallbacks(e,t){const i=this.onInitCallbacks.get(t);if(i)for(const r of i)try{r(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let i=this.instances.get(e);if(!i&&this.component&&(i=this.component.instanceFactory(this.container,{instanceIdentifier:Bi(e),options:t}),this.instances.set(e,i),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(i,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,i)}catch{}return i||null}normalizeInstanceIdentifier(e=ye){return this.component?this.component.multipleInstances?e:ye:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Bi(s){return s===ye?void 0:s}function Vi(s){return s.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hi{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new $i(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var P;(function(s){s[s.DEBUG=0]="DEBUG",s[s.VERBOSE=1]="VERBOSE",s[s.INFO=2]="INFO",s[s.WARN=3]="WARN",s[s.ERROR=4]="ERROR",s[s.SILENT=5]="SILENT"})(P||(P={}));const Wi={debug:P.DEBUG,verbose:P.VERBOSE,info:P.INFO,warn:P.WARN,error:P.ERROR,silent:P.SILENT},zi=P.INFO,qi={[P.DEBUG]:"log",[P.VERBOSE]:"log",[P.INFO]:"info",[P.WARN]:"warn",[P.ERROR]:"error"},Ki=(s,e,...t)=>{if(e<s.logLevel)return;const i=new Date().toISOString(),r=qi[e];if(r)console[r](`[${i}]  ${s.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class ln{constructor(e){this.name=e,this._logLevel=zi,this._logHandler=Ki,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in P))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Wi[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,P.DEBUG,...e),this._logHandler(this,P.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,P.VERBOSE,...e),this._logHandler(this,P.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,P.INFO,...e),this._logHandler(this,P.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,P.WARN,...e),this._logHandler(this,P.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,P.ERROR,...e),this._logHandler(this,P.ERROR,...e)}}const Gi=(s,e)=>e.some(t=>s instanceof t);let gs,_s;function Ji(){return gs||(gs=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Yi(){return _s||(_s=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const cn=new WeakMap,Dt=new WeakMap,dn=new WeakMap,jt=new WeakMap,Qt=new WeakMap;function Xi(s){const e=new Promise((t,i)=>{const r=()=>{s.removeEventListener("success",a),s.removeEventListener("error",o)},a=()=>{t(ge(s.result)),r()},o=()=>{i(s.error),r()};s.addEventListener("success",a),s.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&cn.set(t,s)}).catch(()=>{}),Qt.set(e,s),e}function Qi(s){if(Dt.has(s))return;const e=new Promise((t,i)=>{const r=()=>{s.removeEventListener("complete",a),s.removeEventListener("error",o),s.removeEventListener("abort",o)},a=()=>{t(),r()},o=()=>{i(s.error||new DOMException("AbortError","AbortError")),r()};s.addEventListener("complete",a),s.addEventListener("error",o),s.addEventListener("abort",o)});Dt.set(s,e)}let Lt={get(s,e,t){if(s instanceof IDBTransaction){if(e==="done")return Dt.get(s);if(e==="objectStoreNames")return s.objectStoreNames||dn.get(s);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return ge(s[e])},set(s,e,t){return s[e]=t,!0},has(s,e){return s instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in s}};function Zi(s){Lt=s(Lt)}function er(s){return s===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const i=s.call(It(this),e,...t);return dn.set(i,e.sort?e.sort():[e]),ge(i)}:Yi().includes(s)?function(...e){return s.apply(It(this),e),ge(cn.get(this))}:function(...e){return ge(s.apply(It(this),e))}}function tr(s){return typeof s=="function"?er(s):(s instanceof IDBTransaction&&Qi(s),Gi(s,Ji())?new Proxy(s,Lt):s)}function ge(s){if(s instanceof IDBRequest)return Xi(s);if(jt.has(s))return jt.get(s);const e=tr(s);return e!==s&&(jt.set(s,e),Qt.set(e,s)),e}const It=s=>Qt.get(s);function sr(s,e,{blocked:t,upgrade:i,blocking:r,terminated:a}={}){const o=indexedDB.open(s,e),l=ge(o);return i&&o.addEventListener("upgradeneeded",c=>{i(ge(o.result),c.oldVersion,c.newVersion,ge(o.transaction),c)}),t&&o.addEventListener("blocked",c=>t(c.oldVersion,c.newVersion,c)),l.then(c=>{a&&c.addEventListener("close",()=>a()),r&&c.addEventListener("versionchange",d=>r(d.oldVersion,d.newVersion,d))}).catch(()=>{}),l}const nr=["get","getKey","getAll","getAllKeys","count"],ir=["put","add","delete","clear"],Et=new Map;function vs(s,e){if(!(s instanceof IDBDatabase&&!(e in s)&&typeof e=="string"))return;if(Et.get(e))return Et.get(e);const t=e.replace(/FromIndex$/,""),i=e!==t,r=ir.includes(t);if(!(t in(i?IDBIndex:IDBObjectStore).prototype)||!(r||nr.includes(t)))return;const a=async function(o,...l){const c=this.transaction(o,r?"readwrite":"readonly");let d=c.store;return i&&(d=d.index(l.shift())),(await Promise.all([d[t](...l),r&&c.done]))[0]};return Et.set(e,a),a}Zi(s=>({...s,get:(e,t,i)=>vs(e,t)||s.get(e,t,i),has:(e,t)=>!!vs(e,t)||s.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rr{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(ar(t)){const i=t.getImmediate();return`${i.library}/${i.version}`}else return null}).filter(t=>t).join(" ")}}function ar(s){const e=s.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Mt="@firebase/app",bs="0.10.13";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le=new ln("@firebase/app"),or="@firebase/app-compat",lr="@firebase/analytics-compat",cr="@firebase/analytics",dr="@firebase/app-check-compat",ur="@firebase/app-check",hr="@firebase/auth",mr="@firebase/auth-compat",pr="@firebase/database",fr="@firebase/data-connect",gr="@firebase/database-compat",_r="@firebase/functions",vr="@firebase/functions-compat",br="@firebase/installations",yr="@firebase/installations-compat",xr="@firebase/messaging",Nr="@firebase/messaging-compat",wr="@firebase/performance",jr="@firebase/performance-compat",Ir="@firebase/remote-config",Er="@firebase/remote-config-compat",Sr="@firebase/storage",kr="@firebase/storage-compat",Cr="@firebase/firestore",Tr="@firebase/vertexai-preview",Ar="@firebase/firestore-compat",Rr="firebase",Pr="10.14.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ut="[DEFAULT]",Or={[Mt]:"fire-core",[or]:"fire-core-compat",[cr]:"fire-analytics",[lr]:"fire-analytics-compat",[ur]:"fire-app-check",[dr]:"fire-app-check-compat",[hr]:"fire-auth",[mr]:"fire-auth-compat",[pr]:"fire-rtdb",[fr]:"fire-data-connect",[gr]:"fire-rtdb-compat",[_r]:"fire-fn",[vr]:"fire-fn-compat",[br]:"fire-iid",[yr]:"fire-iid-compat",[xr]:"fire-fcm",[Nr]:"fire-fcm-compat",[wr]:"fire-perf",[jr]:"fire-perf-compat",[Ir]:"fire-rc",[Er]:"fire-rc-compat",[Sr]:"fire-gcs",[kr]:"fire-gcs-compat",[Cr]:"fire-fst",[Ar]:"fire-fst-compat",[Tr]:"fire-vertex","fire-js":"fire-js",[Rr]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ct=new Map,Dr=new Map,Ft=new Map;function ys(s,e){try{s.container.addComponent(e)}catch(t){le.debug(`Component ${e.name} failed to register with FirebaseApp ${s.name}`,t)}}function $e(s){const e=s.name;if(Ft.has(e))return le.debug(`There were multiple attempts to register component ${e}.`),!1;Ft.set(e,s);for(const t of ct.values())ys(t,s);for(const t of Dr.values())ys(t,s);return!0}function un(s,e){const t=s.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),s.container.getProvider(e)}function te(s){return s.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lr={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},_e=new He("app","Firebase",Lr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mr{constructor(e,t,i){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=i,this.container.addComponent(new Pe("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw _e.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ze=Pr;function hn(s,e={}){let t=s;typeof e!="object"&&(e={name:e});const i=Object.assign({name:Ut,automaticDataCollectionEnabled:!1},e),r=i.name;if(typeof r!="string"||!r)throw _e.create("bad-app-name",{appName:String(r)});if(t||(t=an()),!t)throw _e.create("no-options");const a=ct.get(r);if(a){if(lt(t,a.options)&&lt(i,a.config))return a;throw _e.create("duplicate-app",{appName:r})}const o=new Hi(r);for(const c of Ft.values())o.addComponent(c);const l=new Mr(t,i,o);return ct.set(r,l),l}function Ur(s=Ut){const e=ct.get(s);if(!e&&s===Ut&&an())return hn();if(!e)throw _e.create("no-app",{appName:s});return e}function Ce(s,e,t){var i;let r=(i=Or[s])!==null&&i!==void 0?i:s;t&&(r+=`-${t}`);const a=r.match(/\s|\//),o=e.match(/\s|\//);if(a||o){const l=[`Unable to register library "${r}" with version "${e}":`];a&&l.push(`library name "${r}" contains illegal characters (whitespace or "/")`),a&&o&&l.push("and"),o&&l.push(`version name "${e}" contains illegal characters (whitespace or "/")`),le.warn(l.join(" "));return}$e(new Pe(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fr="firebase-heartbeat-database",$r=1,Be="firebase-heartbeat-store";let St=null;function mn(){return St||(St=sr(Fr,$r,{upgrade:(s,e)=>{switch(e){case 0:try{s.createObjectStore(Be)}catch(t){console.warn(t)}}}}).catch(s=>{throw _e.create("idb-open",{originalErrorMessage:s.message})})),St}async function Br(s){try{const t=(await mn()).transaction(Be),i=await t.objectStore(Be).get(pn(s));return await t.done,i}catch(e){if(e instanceof ve)le.warn(e.message);else{const t=_e.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});le.warn(t.message)}}}async function xs(s,e){try{const i=(await mn()).transaction(Be,"readwrite");await i.objectStore(Be).put(e,pn(s)),await i.done}catch(t){if(t instanceof ve)le.warn(t.message);else{const i=_e.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});le.warn(i.message)}}}function pn(s){return`${s.name}!${s.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vr=1024,Hr=30*24*60*60*1e3;class Wr{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new qr(t),this._heartbeatsCachePromise=this._storage.read().then(i=>(this._heartbeatsCache=i,i))}async triggerHeartbeat(){var e,t;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=Ns();return((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(o=>o.date===a)?void 0:(this._heartbeatsCache.heartbeats.push({date:a,agent:r}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(o=>{const l=new Date(o.date).valueOf();return Date.now()-l<=Hr}),this._storage.overwrite(this._heartbeatsCache))}catch(i){le.warn(i)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Ns(),{heartbeatsToSend:i,unsentEntries:r}=zr(this._heartbeatsCache.heartbeats),a=nn(JSON.stringify({version:2,heartbeats:i}));return this._heartbeatsCache.lastSentHeartbeatDate=t,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(t){return le.warn(t),""}}}function Ns(){return new Date().toISOString().substring(0,10)}function zr(s,e=Vr){const t=[];let i=s.slice();for(const r of s){const a=t.find(o=>o.agent===r.agent);if(a){if(a.dates.push(r.date),ws(t)>e){a.dates.pop();break}}else if(t.push({agent:r.agent,dates:[r.date]}),ws(t)>e){t.pop();break}i=i.slice(1)}return{heartbeatsToSend:t,unsentEntries:i}}class qr{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ai()?Ri().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Br(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const r=await this.read();return xs(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){const r=await this.read();return xs(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function ws(s){return nn(JSON.stringify({version:2,heartbeats:s})).length}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kr(s){$e(new Pe("platform-logger",e=>new rr(e),"PRIVATE")),$e(new Pe("heartbeat",e=>new Wr(e),"PRIVATE")),Ce(Mt,bs,s),Ce(Mt,bs,"esm2017"),Ce("fire-js","")}Kr("");function Zt(s,e){var t={};for(var i in s)Object.prototype.hasOwnProperty.call(s,i)&&e.indexOf(i)<0&&(t[i]=s[i]);if(s!=null&&typeof Object.getOwnPropertySymbols=="function")for(var r=0,i=Object.getOwnPropertySymbols(s);r<i.length;r++)e.indexOf(i[r])<0&&Object.prototype.propertyIsEnumerable.call(s,i[r])&&(t[i[r]]=s[i[r]]);return t}function fn(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Gr=fn,gn=new He("auth","Firebase",fn());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dt=new ln("@firebase/auth");function Jr(s,...e){dt.logLevel<=P.WARN&&dt.warn(`Auth (${ze}): ${s}`,...e)}function nt(s,...e){dt.logLevel<=P.ERROR&&dt.error(`Auth (${ze}): ${s}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function X(s,...e){throw es(s,...e)}function se(s,...e){return es(s,...e)}function _n(s,e,t){const i=Object.assign(Object.assign({},Gr()),{[e]:t});return new He("auth","Firebase",i).create(e,{appName:s.name})}function oe(s){return _n(s,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function es(s,...e){if(typeof s!="string"){const t=e[0],i=[...e.slice(1)];return i[0]&&(i[0].appName=s.name),s._errorFactory.create(t,...i)}return gn.create(s,...e)}function E(s,e,...t){if(!s)throw es(e,...t)}function ie(s){const e="INTERNAL ASSERTION FAILED: "+s;throw nt(e),new Error(e)}function ce(s,e){s||ie(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $t(){var s;return typeof self<"u"&&((s=self.location)===null||s===void 0?void 0:s.href)||""}function Yr(){return js()==="http:"||js()==="https:"}function js(){var s;return typeof self<"u"&&((s=self.location)===null||s===void 0?void 0:s.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xr(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Yr()||ki()||"connection"in navigator)?navigator.onLine:!0}function Qr(){if(typeof navigator>"u")return null;const s=navigator;return s.languages&&s.languages[0]||s.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qe{constructor(e,t){this.shortDelay=e,this.longDelay=t,ce(t>e,"Short delay should be less than long delay!"),this.isMobile=Ei()||Ci()}get(){return Xr()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ts(s,e){ce(s.emulator,"Emulator should always be set here");const{url:t}=s.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vn{static initialize(e,t,i){this.fetchImpl=e,t&&(this.headersImpl=t),i&&(this.responseImpl=i)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;ie("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;ie("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;ie("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zr={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ea=new qe(3e4,6e4);function be(s,e){return s.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:s.tenantId}):e}async function de(s,e,t,i,r={}){return bn(s,r,async()=>{let a={},o={};i&&(e==="GET"?o=i:a={body:JSON.stringify(i)});const l=We(Object.assign({key:s.config.apiKey},o)).slice(1),c=await s._getAdditionalHeaders();c["Content-Type"]="application/json",s.languageCode&&(c["X-Firebase-Locale"]=s.languageCode);const d=Object.assign({method:e,headers:c},a);return Si()||(d.referrerPolicy="no-referrer"),vn.fetch()(yn(s,s.config.apiHost,t,l),d)})}async function bn(s,e,t){s._canInitEmulator=!1;const i=Object.assign(Object.assign({},Zr),e);try{const r=new sa(s),a=await Promise.race([t(),r.promise]);r.clearNetworkTimeout();const o=await a.json();if("needConfirmation"in o)throw Ye(s,"account-exists-with-different-credential",o);if(a.ok&&!("errorMessage"in o))return o;{const l=a.ok?o.errorMessage:o.error.message,[c,d]=l.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw Ye(s,"credential-already-in-use",o);if(c==="EMAIL_EXISTS")throw Ye(s,"email-already-in-use",o);if(c==="USER_DISABLED")throw Ye(s,"user-disabled",o);const _=i[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(d)throw _n(s,_,d);X(s,_)}}catch(r){if(r instanceof ve)throw r;X(s,"network-request-failed",{message:String(r)})}}async function Ke(s,e,t,i,r={}){const a=await de(s,e,t,i,r);return"mfaPendingCredential"in a&&X(s,"multi-factor-auth-required",{_serverResponse:a}),a}function yn(s,e,t,i){const r=`${e}${t}?${i}`;return s.config.emulator?ts(s.config,r):`${s.config.apiScheme}://${r}`}function ta(s){switch(s){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class sa{constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,i)=>{this.timer=setTimeout(()=>i(se(this.auth,"network-request-failed")),ea.get())})}clearNetworkTimeout(){clearTimeout(this.timer)}}function Ye(s,e,t){const i={appName:s.name};t.email&&(i.email=t.email),t.phoneNumber&&(i.phoneNumber=t.phoneNumber);const r=se(s,e,i);return r.customData._tokenResponse=t,r}function Is(s){return s!==void 0&&s.enterprise!==void 0}class na{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return ta(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}}async function ia(s,e){return de(s,"GET","/v2/recaptchaConfig",be(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ra(s,e){return de(s,"POST","/v1/accounts:delete",e)}async function xn(s,e){return de(s,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fe(s){if(s)try{const e=new Date(Number(s));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function aa(s,e=!1){const t=Q(s),i=await t.getIdToken(e),r=ss(i);E(r&&r.exp&&r.auth_time&&r.iat,t.auth,"internal-error");const a=typeof r.firebase=="object"?r.firebase:void 0,o=a==null?void 0:a.sign_in_provider;return{claims:r,token:i,authTime:Fe(kt(r.auth_time)),issuedAtTime:Fe(kt(r.iat)),expirationTime:Fe(kt(r.exp)),signInProvider:o||null,signInSecondFactor:(a==null?void 0:a.sign_in_second_factor)||null}}function kt(s){return Number(s)*1e3}function ss(s){const[e,t,i]=s.split(".");if(e===void 0||t===void 0||i===void 0)return nt("JWT malformed, contained fewer than 3 sections"),null;try{const r=rn(t);return r?JSON.parse(r):(nt("Failed to decode base64 JWT payload"),null)}catch(r){return nt("Caught error parsing JWT payload as JSON",r==null?void 0:r.toString()),null}}function Es(s){const e=ss(s);return E(e,"internal-error"),E(typeof e.exp<"u","internal-error"),E(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Oe(s,e,t=!1){if(t)return e;try{return await e}catch(i){throw i instanceof ve&&oa(i)&&s.auth.currentUser===s&&await s.auth.signOut(),i}}function oa({code:s}){return s==="auth/user-disabled"||s==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class la{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const i=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),i}else{this.errorBackoff=3e4;const r=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Fe(this.lastLoginAt),this.creationTime=Fe(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ut(s){var e;const t=s.auth,i=await s.getIdToken(),r=await Oe(s,xn(t,{idToken:i}));E(r==null?void 0:r.users.length,t,"internal-error");const a=r.users[0];s._notifyReloadListener(a);const o=!((e=a.providerUserInfo)===null||e===void 0)&&e.length?Nn(a.providerUserInfo):[],l=da(s.providerData,o),c=s.isAnonymous,d=!(s.email&&a.passwordHash)&&!(l!=null&&l.length),_=c?d:!1,m={uid:a.localId,displayName:a.displayName||null,photoURL:a.photoUrl||null,email:a.email||null,emailVerified:a.emailVerified||!1,phoneNumber:a.phoneNumber||null,tenantId:a.tenantId||null,providerData:l,metadata:new Bt(a.createdAt,a.lastLoginAt),isAnonymous:_};Object.assign(s,m)}async function ca(s){const e=Q(s);await ut(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function da(s,e){return[...s.filter(i=>!e.some(r=>r.providerId===i.providerId)),...e]}function Nn(s){return s.map(e=>{var{providerId:t}=e,i=Zt(e,["providerId"]);return{providerId:t,uid:i.rawId||"",displayName:i.displayName||null,email:i.email||null,phoneNumber:i.phoneNumber||null,photoURL:i.photoUrl||null}})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ua(s,e){const t=await bn(s,{},async()=>{const i=We({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:r,apiKey:a}=s.config,o=yn(s,r,"/v1/token",`key=${a}`),l=await s._getAdditionalHeaders();return l["Content-Type"]="application/x-www-form-urlencoded",vn.fetch()(o,{method:"POST",headers:l,body:i})});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function ha(s,e){return de(s,"POST","/v2/accounts:revokeToken",be(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){E(e.idToken,"internal-error"),E(typeof e.idToken<"u","internal-error"),E(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Es(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){E(e.length!==0,"internal-error");const t=Es(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(E(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:i,refreshToken:r,expiresIn:a}=await ua(e,t);this.updateTokensAndExpiration(i,r,Number(a))}updateTokensAndExpiration(e,t,i){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+i*1e3}static fromJSON(e,t){const{refreshToken:i,accessToken:r,expirationTime:a}=t,o=new Te;return i&&(E(typeof i=="string","internal-error",{appName:e}),o.refreshToken=i),r&&(E(typeof r=="string","internal-error",{appName:e}),o.accessToken=r),a&&(E(typeof a=="number","internal-error",{appName:e}),o.expirationTime=a),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Te,this.toJSON())}_performRefresh(){return ie("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ue(s,e){E(typeof s=="string"||typeof s>"u","internal-error",{appName:e})}class re{constructor(e){var{uid:t,auth:i,stsTokenManager:r}=e,a=Zt(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new la(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=i,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=a.displayName||null,this.email=a.email||null,this.emailVerified=a.emailVerified||!1,this.phoneNumber=a.phoneNumber||null,this.photoURL=a.photoURL||null,this.isAnonymous=a.isAnonymous||!1,this.tenantId=a.tenantId||null,this.providerData=a.providerData?[...a.providerData]:[],this.metadata=new Bt(a.createdAt||void 0,a.lastLoginAt||void 0)}async getIdToken(e){const t=await Oe(this,this.stsTokenManager.getToken(this.auth,e));return E(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return aa(this,e)}reload(){return ca(this)}_assign(e){this!==e&&(E(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new re(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){E(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let i=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),i=!0),t&&await ut(this),await this.auth._persistUserIfCurrent(this),i&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(te(this.auth.app))return Promise.reject(oe(this.auth));const e=await this.getIdToken();return await Oe(this,ra(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var i,r,a,o,l,c,d,_;const m=(i=t.displayName)!==null&&i!==void 0?i:void 0,w=(r=t.email)!==null&&r!==void 0?r:void 0,b=(a=t.phoneNumber)!==null&&a!==void 0?a:void 0,f=(o=t.photoURL)!==null&&o!==void 0?o:void 0,N=(l=t.tenantId)!==null&&l!==void 0?l:void 0,I=(c=t._redirectEventId)!==null&&c!==void 0?c:void 0,p=(d=t.createdAt)!==null&&d!==void 0?d:void 0,x=(_=t.lastLoginAt)!==null&&_!==void 0?_:void 0,{uid:k,emailVerified:A,isAnonymous:D,providerData:L,stsTokenManager:S}=t;E(k&&S,e,"internal-error");const v=Te.fromJSON(this.name,S);E(typeof k=="string",e,"internal-error"),ue(m,e.name),ue(w,e.name),E(typeof A=="boolean",e,"internal-error"),E(typeof D=="boolean",e,"internal-error"),ue(b,e.name),ue(f,e.name),ue(N,e.name),ue(I,e.name),ue(p,e.name),ue(x,e.name);const j=new re({uid:k,auth:e,email:w,emailVerified:A,displayName:m,isAnonymous:D,photoURL:f,phoneNumber:b,tenantId:N,stsTokenManager:v,createdAt:p,lastLoginAt:x});return L&&Array.isArray(L)&&(j.providerData=L.map(g=>Object.assign({},g))),I&&(j._redirectEventId=I),j}static async _fromIdTokenResponse(e,t,i=!1){const r=new Te;r.updateFromServerResponse(t);const a=new re({uid:t.localId,auth:e,stsTokenManager:r,isAnonymous:i});return await ut(a),a}static async _fromGetAccountInfoResponse(e,t,i){const r=t.users[0];E(r.localId!==void 0,"internal-error");const a=r.providerUserInfo!==void 0?Nn(r.providerUserInfo):[],o=!(r.email&&r.passwordHash)&&!(a!=null&&a.length),l=new Te;l.updateFromIdToken(i);const c=new re({uid:r.localId,auth:e,stsTokenManager:l,isAnonymous:o}),d={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new Bt(r.createdAt,r.lastLoginAt),isAnonymous:!(r.email&&r.passwordHash)&&!(a!=null&&a.length)};return Object.assign(c,d),c}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ss=new Map;function ae(s){ce(s instanceof Function,"Expected a class definition");let e=Ss.get(s);return e?(ce(e instanceof s,"Instance stored in cache mismatched with class"),e):(e=new s,Ss.set(s,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wn{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}wn.type="NONE";const ks=wn;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function it(s,e,t){return`firebase:${s}:${e}:${t}`}class Ae{constructor(e,t,i){this.persistence=e,this.auth=t,this.userKey=i;const{config:r,name:a}=this.auth;this.fullUserKey=it(this.userKey,r.apiKey,a),this.fullPersistenceKey=it("persistence",r.apiKey,a),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);return e?re._fromJSON(this.auth,e):null}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,i="authUser"){if(!t.length)return new Ae(ae(ks),e,i);const r=(await Promise.all(t.map(async d=>{if(await d._isAvailable())return d}))).filter(d=>d);let a=r[0]||ae(ks);const o=it(i,e.config.apiKey,e.name);let l=null;for(const d of t)try{const _=await d._get(o);if(_){const m=re._fromJSON(e,_);d!==a&&(l=m),a=d;break}}catch{}const c=r.filter(d=>d._shouldAllowMigration);return!a._shouldAllowMigration||!c.length?new Ae(a,e,i):(a=c[0],l&&await a._set(o,l.toJSON()),await Promise.all(t.map(async d=>{if(d!==a)try{await d._remove(o)}catch{}})),new Ae(a,e,i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cs(s){const e=s.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Sn(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(jn(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Cn(e))return"Blackberry";if(Tn(e))return"Webos";if(In(e))return"Safari";if((e.includes("chrome/")||En(e))&&!e.includes("edge/"))return"Chrome";if(kn(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,i=s.match(t);if((i==null?void 0:i.length)===2)return i[1]}return"Other"}function jn(s=q()){return/firefox\//i.test(s)}function In(s=q()){const e=s.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function En(s=q()){return/crios\//i.test(s)}function Sn(s=q()){return/iemobile/i.test(s)}function kn(s=q()){return/android/i.test(s)}function Cn(s=q()){return/blackberry/i.test(s)}function Tn(s=q()){return/webos/i.test(s)}function ns(s=q()){return/iphone|ipad|ipod/i.test(s)||/macintosh/i.test(s)&&/mobile/i.test(s)}function ma(s=q()){var e;return ns(s)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function pa(){return Ti()&&document.documentMode===10}function An(s=q()){return ns(s)||kn(s)||Tn(s)||Cn(s)||/windows phone/i.test(s)||Sn(s)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rn(s,e=[]){let t;switch(s){case"Browser":t=Cs(q());break;case"Worker":t=`${Cs(q())}-${s}`;break;default:t=s}const i=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${ze}/${i}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fa{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const i=a=>new Promise((o,l)=>{try{const c=e(a);o(c)}catch(c){l(c)}});i.onAbort=t,this.queue.push(i);const r=this.queue.length-1;return()=>{this.queue[r]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const i of this.queue)await i(e),i.onAbort&&t.push(i.onAbort)}catch(i){t.reverse();for(const r of t)try{r()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:i==null?void 0:i.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ga(s,e={}){return de(s,"GET","/v2/passwordPolicy",be(s,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _a=6;class va{constructor(e){var t,i,r,a;const o=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=o.minPasswordLength)!==null&&t!==void 0?t:_a,o.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=o.maxPasswordLength),o.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=o.containsLowercaseCharacter),o.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=o.containsUppercaseCharacter),o.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=o.containsNumericCharacter),o.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=o.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(r=(i=e.allowedNonAlphanumericCharacters)===null||i===void 0?void 0:i.join(""))!==null&&r!==void 0?r:"",this.forceUpgradeOnSignin=(a=e.forceUpgradeOnSignin)!==null&&a!==void 0?a:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,i,r,a,o,l;const c={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,c),this.validatePasswordCharacterOptions(e,c),c.isValid&&(c.isValid=(t=c.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),c.isValid&&(c.isValid=(i=c.meetsMaxPasswordLength)!==null&&i!==void 0?i:!0),c.isValid&&(c.isValid=(r=c.containsLowercaseLetter)!==null&&r!==void 0?r:!0),c.isValid&&(c.isValid=(a=c.containsUppercaseLetter)!==null&&a!==void 0?a:!0),c.isValid&&(c.isValid=(o=c.containsNumericCharacter)!==null&&o!==void 0?o:!0),c.isValid&&(c.isValid=(l=c.containsNonAlphanumericCharacter)!==null&&l!==void 0?l:!0),c}validatePasswordLengthOptions(e,t){const i=this.customStrengthOptions.minPasswordLength,r=this.customStrengthOptions.maxPasswordLength;i&&(t.meetsMinPasswordLength=e.length>=i),r&&(t.meetsMaxPasswordLength=e.length<=r)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let i;for(let r=0;r<e.length;r++)i=e.charAt(r),this.updatePasswordCharacterOptionsStatuses(t,i>="a"&&i<="z",i>="A"&&i<="Z",i>="0"&&i<="9",this.allowedNonAlphanumericCharacters.includes(i))}updatePasswordCharacterOptionsStatuses(e,t,i,r,a){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=i)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=r)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=a))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ba{constructor(e,t,i,r){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=i,this.config=r,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Ts(this),this.idTokenSubscription=new Ts(this),this.beforeStateQueue=new fa(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=gn,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=r.sdkClientVersion}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=ae(t)),this._initializationPromise=this.queue(async()=>{var i,r;if(!this._deleted&&(this.persistenceManager=await Ae.create(this,e),!this._deleted)){if(!((i=this._popupRedirectResolver)===null||i===void 0)&&i._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((r=this.currentUser)===null||r===void 0?void 0:r.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await xn(this,{idToken:e}),i=await re._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(i)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(te(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(l=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(l,l))}):this.directlySetCurrentUser(null)}const i=await this.assertedPersistence.getCurrentUser();let r=i,a=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,l=r==null?void 0:r._redirectEventId,c=await this.tryRedirectSignIn(e);(!o||o===l)&&(c!=null&&c.user)&&(r=c.user,a=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(a)try{await this.beforeStateQueue.runMiddleware(r)}catch(o){r=i,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return E(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await ut(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=Qr()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(te(this.app))return Promise.reject(oe(this));const t=e?Q(e):null;return t&&E(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&E(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return te(this.app)?Promise.reject(oe(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return te(this.app)?Promise.reject(oe(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(ae(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await ga(this),t=new va(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistence(){return this.assertedPersistence.persistence.type}_updateErrorMap(e){this._errorFactory=new He("auth","Firebase",e())}onAuthStateChanged(e,t,i){return this.registerStateListener(this.authStateSubscription,e,t,i)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,i){return this.registerStateListener(this.idTokenSubscription,e,t,i)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const i=this.onAuthStateChanged(()=>{i(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),i={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(i.tenantId=this.tenantId),await ha(this,i)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){const i=await this.getOrInitRedirectPersistenceManager(t);return e===null?i.removeCurrentUser():i.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&ae(e)||this._popupRedirectResolver;E(t,this,"argument-error"),this.redirectPersistenceManager=await Ae.create(this,[ae(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,i;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((i=this.redirectUser)===null||i===void 0?void 0:i._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const i=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==i&&(this.lastNotifiedUid=i,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,i,r){if(this._deleted)return()=>{};const a=typeof t=="function"?t:t.next.bind(t);let o=!1;const l=this._isInitialized?Promise.resolve():this._initializationPromise;if(E(l,this,"internal-error"),l.then(()=>{o||a(this.currentUser)}),typeof t=="function"){const c=e.addObserver(t,i,r);return()=>{o=!0,c()}}else{const c=e.addObserver(t);return()=>{o=!0,c()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return E(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Rn(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const i=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());i&&(t["X-Firebase-Client"]=i);const r=await this._getAppCheckToken();return r&&(t["X-Firebase-AppCheck"]=r),t}async _getAppCheckToken(){var e;const t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&Jr(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}}function je(s){return Q(s)}class Ts{constructor(e){this.auth=e,this.observer=null,this.addObserver=Mi(t=>this.observer=t)}get next(){return E(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let gt={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function ya(s){gt=s}function Pn(s){return gt.loadJS(s)}function xa(){return gt.recaptchaEnterpriseScript}function Na(){return gt.gapiScript}function wa(s){return`__${s}${Math.floor(Math.random()*1e6)}`}const ja="recaptcha-enterprise",Ia="NO_RECAPTCHA";class Ea{constructor(e){this.type=ja,this.auth=je(e)}async verify(e="verify",t=!1){async function i(a){if(!t){if(a.tenantId==null&&a._agentRecaptchaConfig!=null)return a._agentRecaptchaConfig.siteKey;if(a.tenantId!=null&&a._tenantRecaptchaConfigs[a.tenantId]!==void 0)return a._tenantRecaptchaConfigs[a.tenantId].siteKey}return new Promise(async(o,l)=>{ia(a,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(c=>{if(c.recaptchaKey===void 0)l(new Error("recaptcha Enterprise site key undefined"));else{const d=new na(c);return a.tenantId==null?a._agentRecaptchaConfig=d:a._tenantRecaptchaConfigs[a.tenantId]=d,o(d.siteKey)}}).catch(c=>{l(c)})})}function r(a,o,l){const c=window.grecaptcha;Is(c)?c.enterprise.ready(()=>{c.enterprise.execute(a,{action:e}).then(d=>{o(d)}).catch(()=>{o(Ia)})}):l(Error("No reCAPTCHA enterprise script loaded."))}return new Promise((a,o)=>{i(this.auth).then(l=>{if(!t&&Is(window.grecaptcha))r(l,a,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let c=xa();c.length!==0&&(c+=l),Pn(c).then(()=>{r(l,a,o)}).catch(d=>{o(d)})}}).catch(l=>{o(l)})})}}async function As(s,e,t,i=!1){const r=new Ea(s);let a;try{a=await r.verify(t)}catch{a=await r.verify(t,!0)}const o=Object.assign({},e);return i?Object.assign(o,{captchaResp:a}):Object.assign(o,{captchaResponse:a}),Object.assign(o,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(o,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),o}async function Vt(s,e,t,i){var r;if(!((r=s._getRecaptchaConfig())===null||r===void 0)&&r.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const a=await As(s,e,t,t==="getOobCode");return i(s,a)}else return i(s,e).catch(async a=>{if(a.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const o=await As(s,e,t,t==="getOobCode");return i(s,o)}else return Promise.reject(a)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Sa(s,e){const t=un(s,"auth");if(t.isInitialized()){const r=t.getImmediate(),a=t.getOptions();if(lt(a,e??{}))return r;X(r,"already-initialized")}return t.initialize({options:e})}function ka(s,e){const t=(e==null?void 0:e.persistence)||[],i=(Array.isArray(t)?t:[t]).map(ae);e!=null&&e.errorMap&&s._updateErrorMap(e.errorMap),s._initializeWithPersistence(i,e==null?void 0:e.popupRedirectResolver)}function Ca(s,e,t){const i=je(s);E(i._canInitEmulator,i,"emulator-config-failed"),E(/^https?:\/\//.test(e),i,"invalid-emulator-scheme");const r=!1,a=On(e),{host:o,port:l}=Ta(e),c=l===null?"":`:${l}`;i.config.emulator={url:`${a}//${o}${c}/`},i.settings.appVerificationDisabledForTesting=!0,i.emulatorConfig=Object.freeze({host:o,port:l,protocol:a.replace(":",""),options:Object.freeze({disableWarnings:r})}),Aa()}function On(s){const e=s.indexOf(":");return e<0?"":s.substr(0,e+1)}function Ta(s){const e=On(s),t=/(\/\/)?([^?#/]+)/.exec(s.substr(e.length));if(!t)return{host:"",port:null};const i=t[2].split("@").pop()||"",r=/^(\[[^\]]+\])(:|$)/.exec(i);if(r){const a=r[1];return{host:a,port:Rs(i.substr(a.length+1))}}else{const[a,o]=i.split(":");return{host:a,port:Rs(o)}}}function Rs(s){if(!s)return null;const e=Number(s);return isNaN(e)?null:e}function Aa(){function s(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",s):s())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class is{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return ie("not implemented")}_getIdTokenResponse(e){return ie("not implemented")}_linkToIdToken(e,t){return ie("not implemented")}_getReauthenticationResolver(e){return ie("not implemented")}}async function Ra(s,e){return de(s,"POST","/v1/accounts:signUp",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Pa(s,e){return Ke(s,"POST","/v1/accounts:signInWithPassword",be(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Oa(s,e){return Ke(s,"POST","/v1/accounts:signInWithEmailLink",be(s,e))}async function Da(s,e){return Ke(s,"POST","/v1/accounts:signInWithEmailLink",be(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ve extends is{constructor(e,t,i,r=null){super("password",i),this._email=e,this._password=t,this._tenantId=r}static _fromEmailAndPassword(e,t){return new Ve(e,t,"password")}static _fromEmailAndCode(e,t,i=null){return new Ve(e,t,"emailLink",i)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t!=null&&t.email&&(t!=null&&t.password)){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Vt(e,t,"signInWithPassword",Pa);case"emailLink":return Oa(e,{email:this._email,oobCode:this._password});default:X(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const i={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return Vt(e,i,"signUpPassword",Ra);case"emailLink":return Da(e,{idToken:t,email:this._email,oobCode:this._password});default:X(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Re(s,e){return Ke(s,"POST","/v1/accounts:signInWithIdp",be(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const La="http://localhost";class Ne extends is{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new Ne(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):X("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:i,signInMethod:r}=t,a=Zt(t,["providerId","signInMethod"]);if(!i||!r)return null;const o=new Ne(i,r);return o.idToken=a.idToken||void 0,o.accessToken=a.accessToken||void 0,o.secret=a.secret,o.nonce=a.nonce,o.pendingToken=a.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return Re(e,t)}_linkToIdToken(e,t){const i=this.buildRequest();return i.idToken=t,Re(e,i)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Re(e,t)}buildRequest(){const e={requestUri:La,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=We(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ma(s){switch(s){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function Ua(s){const e=Me(Ue(s)).link,t=e?Me(Ue(e)).deep_link_id:null,i=Me(Ue(s)).deep_link_id;return(i?Me(Ue(i)).link:null)||i||t||e||s}class rs{constructor(e){var t,i,r,a,o,l;const c=Me(Ue(e)),d=(t=c.apiKey)!==null&&t!==void 0?t:null,_=(i=c.oobCode)!==null&&i!==void 0?i:null,m=Ma((r=c.mode)!==null&&r!==void 0?r:null);E(d&&_&&m,"argument-error"),this.apiKey=d,this.operation=m,this.code=_,this.continueUrl=(a=c.continueUrl)!==null&&a!==void 0?a:null,this.languageCode=(o=c.languageCode)!==null&&o!==void 0?o:null,this.tenantId=(l=c.tenantId)!==null&&l!==void 0?l:null}static parseLink(e){const t=Ua(e);try{return new rs(t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class De{constructor(){this.providerId=De.PROVIDER_ID}static credential(e,t){return Ve._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const i=rs.parseLink(t);return E(i,"argument-error"),Ve._fromEmailAndCode(e,i.code,i.tenantId)}}De.PROVIDER_ID="password";De.EMAIL_PASSWORD_SIGN_IN_METHOD="password";De.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dn{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ge extends Dn{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class he extends Ge{constructor(){super("facebook.com")}static credential(e){return Ne._fromParams({providerId:he.PROVIDER_ID,signInMethod:he.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return he.credentialFromTaggedObject(e)}static credentialFromError(e){return he.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return he.credential(e.oauthAccessToken)}catch{return null}}}he.FACEBOOK_SIGN_IN_METHOD="facebook.com";he.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class me extends Ge{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return Ne._fromParams({providerId:me.PROVIDER_ID,signInMethod:me.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return me.credentialFromTaggedObject(e)}static credentialFromError(e){return me.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:i}=e;if(!t&&!i)return null;try{return me.credential(t,i)}catch{return null}}}me.GOOGLE_SIGN_IN_METHOD="google.com";me.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pe extends Ge{constructor(){super("github.com")}static credential(e){return Ne._fromParams({providerId:pe.PROVIDER_ID,signInMethod:pe.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return pe.credentialFromTaggedObject(e)}static credentialFromError(e){return pe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return pe.credential(e.oauthAccessToken)}catch{return null}}}pe.GITHUB_SIGN_IN_METHOD="github.com";pe.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fe extends Ge{constructor(){super("twitter.com")}static credential(e,t){return Ne._fromParams({providerId:fe.PROVIDER_ID,signInMethod:fe.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return fe.credentialFromTaggedObject(e)}static credentialFromError(e){return fe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:i}=e;if(!t||!i)return null;try{return fe.credential(t,i)}catch{return null}}}fe.TWITTER_SIGN_IN_METHOD="twitter.com";fe.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Fa(s,e){return Ke(s,"POST","/v1/accounts:signUp",be(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class we{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,i,r=!1){const a=await re._fromIdTokenResponse(e,i,r),o=Ps(i);return new we({user:a,providerId:o,_tokenResponse:i,operationType:t})}static async _forOperation(e,t,i){await e._updateTokensIfNecessary(i,!0);const r=Ps(i);return new we({user:e,providerId:r,_tokenResponse:i,operationType:t})}}function Ps(s){return s.providerId?s.providerId:"phoneNumber"in s?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht extends ve{constructor(e,t,i,r){var a;super(t.code,t.message),this.operationType=i,this.user=r,Object.setPrototypeOf(this,ht.prototype),this.customData={appName:e.name,tenantId:(a=e.tenantId)!==null&&a!==void 0?a:void 0,_serverResponse:t.customData._serverResponse,operationType:i}}static _fromErrorAndOperation(e,t,i,r){return new ht(e,t,i,r)}}function Ln(s,e,t,i){return(e==="reauthenticate"?t._getReauthenticationResolver(s):t._getIdTokenResponse(s)).catch(a=>{throw a.code==="auth/multi-factor-auth-required"?ht._fromErrorAndOperation(s,a,e,i):a})}async function $a(s,e,t=!1){const i=await Oe(s,e._linkToIdToken(s.auth,await s.getIdToken()),t);return we._forOperation(s,"link",i)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ba(s,e,t=!1){const{auth:i}=s;if(te(i.app))return Promise.reject(oe(i));const r="reauthenticate";try{const a=await Oe(s,Ln(i,r,e,s),t);E(a.idToken,i,"internal-error");const o=ss(a.idToken);E(o,i,"internal-error");const{sub:l}=o;return E(s.uid===l,i,"user-mismatch"),we._forOperation(s,r,a)}catch(a){throw(a==null?void 0:a.code)==="auth/user-not-found"&&X(i,"user-mismatch"),a}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Mn(s,e,t=!1){if(te(s.app))return Promise.reject(oe(s));const i="signIn",r=await Ln(s,i,e),a=await we._fromIdTokenResponse(s,i,r);return t||await s._updateCurrentUser(a.user),a}async function Va(s,e){return Mn(je(s),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Un(s){const e=je(s);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function Ha(s,e,t){if(te(s.app))return Promise.reject(oe(s));const i=je(s),o=await Vt(i,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",Fa).catch(c=>{throw c.code==="auth/password-does-not-meet-requirements"&&Un(s),c}),l=await we._fromIdTokenResponse(i,"signIn",o);return await i._updateCurrentUser(l.user),l}function Wa(s,e,t){return te(s.app)?Promise.reject(oe(s)):Va(Q(s),De.credential(e,t)).catch(async i=>{throw i.code==="auth/password-does-not-meet-requirements"&&Un(s),i})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function za(s,e){return de(s,"POST","/v1/accounts:update",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qa(s,{displayName:e,photoURL:t}){if(e===void 0&&t===void 0)return;const i=Q(s),a={idToken:await i.getIdToken(),displayName:e,photoUrl:t,returnSecureToken:!0},o=await Oe(i,za(i.auth,a));i.displayName=o.displayName||null,i.photoURL=o.photoUrl||null;const l=i.providerData.find(({providerId:c})=>c==="password");l&&(l.displayName=i.displayName,l.photoURL=i.photoURL),await i._updateTokensIfNecessary(o)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ka(s,e){return Q(s).setPersistence(e)}function Ga(s,e,t,i){return Q(s).onIdTokenChanged(e,t,i)}function Ja(s,e,t){return Q(s).beforeAuthStateChanged(e,t)}function Ya(s,e,t,i){return Q(s).onAuthStateChanged(e,t,i)}function Ct(s){return Q(s).signOut()}const mt="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fn{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(mt,"1"),this.storage.removeItem(mt),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xa=1e3,Qa=10;class $n extends Fn{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=An(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const i=this.storage.getItem(t),r=this.localCache[t];i!==r&&e(t,r,i)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,l,c)=>{this.notifyListeners(o,c)});return}const i=e.key;t?this.detachListener():this.stopPolling();const r=()=>{const o=this.storage.getItem(i);!t&&this.localCache[i]===o||this.notifyListeners(i,o)},a=this.storage.getItem(i);pa()&&a!==e.newValue&&e.newValue!==e.oldValue?setTimeout(r,Qa):r()}notifyListeners(e,t){this.localCache[e]=t;const i=this.listeners[e];if(i)for(const r of Array.from(i))r(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,i)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:i}),!0)})},Xa)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}$n.type="LOCAL";const Bn=$n;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vn extends Fn{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Vn.type="SESSION";const Hn=Vn;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Za(s){return Promise.all(s.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _t{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(r=>r.isListeningto(e));if(t)return t;const i=new _t(e);return this.receivers.push(i),i}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:i,eventType:r,data:a}=t.data,o=this.handlersMap[r];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:i,eventType:r});const l=Array.from(o).map(async d=>d(t.origin,a)),c=await Za(l);t.ports[0].postMessage({status:"done",eventId:i,eventType:r,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}_t.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function as(s="",e=10){let t="";for(let i=0;i<e;i++)t+=Math.floor(Math.random()*10);return s+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eo{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,i=50){const r=typeof MessageChannel<"u"?new MessageChannel:null;if(!r)throw new Error("connection_unavailable");let a,o;return new Promise((l,c)=>{const d=as("",20);r.port1.start();const _=setTimeout(()=>{c(new Error("unsupported_event"))},i);o={messageChannel:r,onMessage(m){const w=m;if(w.data.eventId===d)switch(w.data.status){case"ack":clearTimeout(_),a=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(a),l(w.data.response);break;default:clearTimeout(_),clearTimeout(a),c(new Error("invalid_response"));break}}},this.handlers.add(o),r.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:d,data:t},[r.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ne(){return window}function to(s){ne().location.href=s}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wn(){return typeof ne().WorkerGlobalScope<"u"&&typeof ne().importScripts=="function"}async function so(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function no(){var s;return((s=navigator==null?void 0:navigator.serviceWorker)===null||s===void 0?void 0:s.controller)||null}function io(){return Wn()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zn="firebaseLocalStorageDb",ro=1,pt="firebaseLocalStorage",qn="fbase_key";class Je{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function vt(s,e){return s.transaction([pt],e?"readwrite":"readonly").objectStore(pt)}function ao(){const s=indexedDB.deleteDatabase(zn);return new Je(s).toPromise()}function Ht(){const s=indexedDB.open(zn,ro);return new Promise((e,t)=>{s.addEventListener("error",()=>{t(s.error)}),s.addEventListener("upgradeneeded",()=>{const i=s.result;try{i.createObjectStore(pt,{keyPath:qn})}catch(r){t(r)}}),s.addEventListener("success",async()=>{const i=s.result;i.objectStoreNames.contains(pt)?e(i):(i.close(),await ao(),e(await Ht()))})})}async function Os(s,e,t){const i=vt(s,!0).put({[qn]:e,value:t});return new Je(i).toPromise()}async function oo(s,e){const t=vt(s,!1).get(e),i=await new Je(t).toPromise();return i===void 0?null:i.value}function Ds(s,e){const t=vt(s,!0).delete(e);return new Je(t).toPromise()}const lo=800,co=3;class Kn{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Ht(),this.db)}async _withRetries(e){let t=0;for(;;)try{const i=await this._openDb();return await e(i)}catch(i){if(t++>co)throw i;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Wn()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=_t._getInstance(io()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await so(),!this.activeServiceWorker)return;this.sender=new eo(this.activeServiceWorker);const i=await this.sender._send("ping",{},800);i&&!((e=i[0])===null||e===void 0)&&e.fulfilled&&!((t=i[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||no()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await Ht();return await Os(e,mt,"1"),await Ds(e,mt),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(i=>Os(i,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(i=>oo(i,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>Ds(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(r=>{const a=vt(r,!1).getAll();return new Je(a).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],i=new Set;if(e.length!==0)for(const{fbase_key:r,value:a}of e)i.add(r),JSON.stringify(this.localCache[r])!==JSON.stringify(a)&&(this.notifyListeners(r,a),t.push(r));for(const r of Object.keys(this.localCache))this.localCache[r]&&!i.has(r)&&(this.notifyListeners(r,null),t.push(r));return t}notifyListeners(e,t){this.localCache[e]=t;const i=this.listeners[e];if(i)for(const r of Array.from(i))r(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),lo)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}Kn.type="LOCAL";const uo=Kn;new qe(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ho(s,e){return e?ae(e):(E(s._popupRedirectResolver,s,"argument-error"),s._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class os extends is{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Re(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Re(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Re(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function mo(s){return Mn(s.auth,new os(s),s.bypassAuthState)}function po(s){const{auth:e,user:t}=s;return E(t,e,"internal-error"),Ba(t,new os(s),s.bypassAuthState)}async function fo(s){const{auth:e,user:t}=s;return E(t,e,"internal-error"),$a(t,new os(s),s.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gn{constructor(e,t,i,r,a=!1){this.auth=e,this.resolver=i,this.user=r,this.bypassAuthState=a,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(i){this.reject(i)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:i,postBody:r,tenantId:a,error:o,type:l}=e;if(o){this.reject(o);return}const c={auth:this.auth,requestUri:t,sessionId:i,tenantId:a||void 0,postBody:r||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(l)(c))}catch(d){this.reject(d)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return mo;case"linkViaPopup":case"linkViaRedirect":return fo;case"reauthViaPopup":case"reauthViaRedirect":return po;default:X(this.auth,"internal-error")}}resolve(e){ce(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){ce(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const go=new qe(2e3,1e4);class ke extends Gn{constructor(e,t,i,r,a){super(e,t,r,a),this.provider=i,this.authWindow=null,this.pollId=null,ke.currentPopupAction&&ke.currentPopupAction.cancel(),ke.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return E(e,this.auth,"internal-error"),e}async onExecution(){ce(this.filter.length===1,"Popup operations only handle one event");const e=as();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(se(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(se(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,ke.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,i;if(!((i=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||i===void 0)&&i.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(se(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,go.get())};e()}}ke.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _o="pendingRedirect",rt=new Map;class vo extends Gn{constructor(e,t,i=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,i),this.eventId=null}async execute(){let e=rt.get(this.auth._key());if(!e){try{const i=await bo(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(i)}catch(t){e=()=>Promise.reject(t)}rt.set(this.auth._key(),e)}return this.bypassAuthState||rt.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function bo(s,e){const t=No(e),i=xo(s);if(!await i._isAvailable())return!1;const r=await i._get(t)==="true";return await i._remove(t),r}function yo(s,e){rt.set(s._key(),e)}function xo(s){return ae(s._redirectPersistence)}function No(s){return it(_o,s.config.apiKey,s.name)}async function wo(s,e,t=!1){if(te(s.app))return Promise.reject(oe(s));const i=je(s),r=ho(i,e),o=await new vo(i,r,t).execute();return o&&!t&&(delete o.user._redirectEventId,await i._persistUserIfCurrent(o.user),await i._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jo=10*60*1e3;class Io{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(i=>{this.isEventForConsumer(e,i)&&(t=!0,this.sendToConsumer(e,i),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!Eo(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var i;if(e.error&&!Jn(e)){const r=((i=e.error.code)===null||i===void 0?void 0:i.split("auth/")[1])||"internal-error";t.onError(se(this.auth,r))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const i=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&i}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=jo&&this.cachedEventUids.clear(),this.cachedEventUids.has(Ls(e))}saveEventToCache(e){this.cachedEventUids.add(Ls(e)),this.lastProcessedEventTime=Date.now()}}function Ls(s){return[s.type,s.eventId,s.sessionId,s.tenantId].filter(e=>e).join("-")}function Jn({type:s,error:e}){return s==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function Eo(s){switch(s.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Jn(s);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function So(s,e={}){return de(s,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ko=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Co=/^https?/;async function To(s){if(s.config.emulator)return;const{authorizedDomains:e}=await So(s);for(const t of e)try{if(Ao(t))return}catch{}X(s,"unauthorized-domain")}function Ao(s){const e=$t(),{protocol:t,hostname:i}=new URL(e);if(s.startsWith("chrome-extension://")){const o=new URL(s);return o.hostname===""&&i===""?t==="chrome-extension:"&&s.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===i}if(!Co.test(t))return!1;if(ko.test(s))return i===s;const r=s.replace(/\./g,"\\.");return new RegExp("^(.+\\."+r+"|"+r+")$","i").test(i)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ro=new qe(3e4,6e4);function Ms(){const s=ne().___jsl;if(s!=null&&s.H){for(const e of Object.keys(s.H))if(s.H[e].r=s.H[e].r||[],s.H[e].L=s.H[e].L||[],s.H[e].r=[...s.H[e].L],s.CP)for(let t=0;t<s.CP.length;t++)s.CP[t]=null}}function Po(s){return new Promise((e,t)=>{var i,r,a;function o(){Ms(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Ms(),t(se(s,"network-request-failed"))},timeout:Ro.get()})}if(!((r=(i=ne().gapi)===null||i===void 0?void 0:i.iframes)===null||r===void 0)&&r.Iframe)e(gapi.iframes.getContext());else if(!((a=ne().gapi)===null||a===void 0)&&a.load)o();else{const l=wa("iframefcb");return ne()[l]=()=>{gapi.load?o():t(se(s,"network-request-failed"))},Pn(`${Na()}?onload=${l}`).catch(c=>t(c))}}).catch(e=>{throw at=null,e})}let at=null;function Oo(s){return at=at||Po(s),at}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Do=new qe(5e3,15e3),Lo="__/auth/iframe",Mo="emulator/auth/iframe",Uo={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Fo=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function $o(s){const e=s.config;E(e.authDomain,s,"auth-domain-config-required");const t=e.emulator?ts(e,Mo):`https://${s.config.authDomain}/${Lo}`,i={apiKey:e.apiKey,appName:s.name,v:ze},r=Fo.get(s.config.apiHost);r&&(i.eid=r);const a=s._getFrameworks();return a.length&&(i.fw=a.join(",")),`${t}?${We(i).slice(1)}`}async function Bo(s){const e=await Oo(s),t=ne().gapi;return E(t,s,"internal-error"),e.open({where:document.body,url:$o(s),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Uo,dontclear:!0},i=>new Promise(async(r,a)=>{await i.restyle({setHideOnLeave:!1});const o=se(s,"network-request-failed"),l=ne().setTimeout(()=>{a(o)},Do.get());function c(){ne().clearTimeout(l),r(i)}i.ping(c).then(c,()=>{a(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vo={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Ho=500,Wo=600,zo="_blank",qo="http://localhost";class Us{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Ko(s,e,t,i=Ho,r=Wo){const a=Math.max((window.screen.availHeight-r)/2,0).toString(),o=Math.max((window.screen.availWidth-i)/2,0).toString();let l="";const c=Object.assign(Object.assign({},Vo),{width:i.toString(),height:r.toString(),top:a,left:o}),d=q().toLowerCase();t&&(l=En(d)?zo:t),jn(d)&&(e=e||qo,c.scrollbars="yes");const _=Object.entries(c).reduce((w,[b,f])=>`${w}${b}=${f},`,"");if(ma(d)&&l!=="_self")return Go(e||"",l),new Us(null);const m=window.open(e||"",l,_);E(m,s,"popup-blocked");try{m.focus()}catch{}return new Us(m)}function Go(s,e){const t=document.createElement("a");t.href=s,t.target=e;const i=document.createEvent("MouseEvent");i.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(i)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jo="__/auth/handler",Yo="emulator/auth/handler",Xo=encodeURIComponent("fac");async function Fs(s,e,t,i,r,a){E(s.config.authDomain,s,"auth-domain-config-required"),E(s.config.apiKey,s,"invalid-api-key");const o={apiKey:s.config.apiKey,appName:s.name,authType:t,redirectUrl:i,v:ze,eventId:r};if(e instanceof Dn){e.setDefaultLanguage(s.languageCode),o.providerId=e.providerId||"",Li(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[_,m]of Object.entries({}))o[_]=m}if(e instanceof Ge){const _=e.getScopes().filter(m=>m!=="");_.length>0&&(o.scopes=_.join(","))}s.tenantId&&(o.tid=s.tenantId);const l=o;for(const _ of Object.keys(l))l[_]===void 0&&delete l[_];const c=await s._getAppCheckToken(),d=c?`#${Xo}=${encodeURIComponent(c)}`:"";return`${Qo(s)}?${We(l).slice(1)}${d}`}function Qo({config:s}){return s.emulator?ts(s,Yo):`https://${s.authDomain}/${Jo}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tt="webStorageSupport";class Zo{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Hn,this._completeRedirectFn=wo,this._overrideRedirectResult=yo}async _openPopup(e,t,i,r){var a;ce((a=this.eventManagers[e._key()])===null||a===void 0?void 0:a.manager,"_initialize() not called before _openPopup()");const o=await Fs(e,t,i,$t(),r);return Ko(e,o,as())}async _openRedirect(e,t,i,r){await this._originValidation(e);const a=await Fs(e,t,i,$t(),r);return to(a),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:r,promise:a}=this.eventManagers[t];return r?Promise.resolve(r):(ce(a,"If manager is not set, promise should be"),a)}const i=this.initAndGetManager(e);return this.eventManagers[t]={promise:i},i.catch(()=>{delete this.eventManagers[t]}),i}async initAndGetManager(e){const t=await Bo(e),i=new Io(e);return t.register("authEvent",r=>(E(r==null?void 0:r.authEvent,e,"invalid-auth-event"),{status:i.onEvent(r.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:i},this.iframes[e._key()]=t,i}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Tt,{type:Tt},r=>{var a;const o=(a=r==null?void 0:r[0])===null||a===void 0?void 0:a[Tt];o!==void 0&&t(!!o),X(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=To(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return An()||In()||ns()}}const el=Zo;var $s="@firebase/auth",Bs="1.7.9";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tl{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(i=>{e((i==null?void 0:i.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){E(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sl(s){switch(s){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function nl(s){$e(new Pe("auth",(e,{options:t})=>{const i=e.getProvider("app").getImmediate(),r=e.getProvider("heartbeat"),a=e.getProvider("app-check-internal"),{apiKey:o,authDomain:l}=i.options;E(o&&!o.includes(":"),"invalid-api-key",{appName:i.name});const c={apiKey:o,authDomain:l,clientPlatform:s,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Rn(s)},d=new ba(i,r,a,c);return ka(d,t),d},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,i)=>{e.getProvider("auth-internal").initialize()})),$e(new Pe("auth-internal",e=>{const t=je(e.getProvider("auth").getImmediate());return(i=>new tl(i))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Ce($s,Bs,sl(s)),Ce($s,Bs,"esm2017")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const il=5*60,rl=on("authIdTokenMaxAge")||il;let Vs=null;const al=s=>async e=>{const t=e&&await e.getIdTokenResult(),i=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(i&&i>rl)return;const r=t==null?void 0:t.token;Vs!==r&&(Vs=r,await fetch(s,{method:r?"POST":"DELETE",headers:r?{Authorization:`Bearer ${r}`}:{}}))};function ol(s=Ur()){const e=un(s,"auth");if(e.isInitialized())return e.getImmediate();const t=Sa(s,{popupRedirectResolver:el,persistence:[uo,Bn,Hn]}),i=on("authTokenSyncURL");if(i&&typeof isSecureContext=="boolean"&&isSecureContext){const a=new URL(i,location.origin);if(location.origin===a.origin){const o=al(a.toString());Ja(t,o,()=>o(t.currentUser)),Ga(t,l=>o(l))}}const r=ji("auth");return r&&Ca(t,`http://${r}`),t}function ll(){var s,e;return(e=(s=document.getElementsByTagName("head"))===null||s===void 0?void 0:s[0])!==null&&e!==void 0?e:document}ya({loadJS(s){return new Promise((e,t)=>{const i=document.createElement("script");i.setAttribute("src",s),i.onload=e,i.onerror=r=>{const a=se("internal-error");a.customData=r,t(a)},i.type="text/javascript",i.charset="UTF-8",ll().appendChild(i)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});nl("Browser");var cl="firebase",dl="10.14.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ce(cl,dl,"app");const Wt={apiKey:void 0,authDomain:void 0,projectId:void 0,storageBucket:void 0,messagingSenderId:void 0,appId:void 0},Se=!!Wt.apiKey&&!Wt.apiKey.startsWith("YOUR_");let zt=null;if(Se){const s=hn(Wt);zt=ol(s),Ka(zt,Bn).catch(e=>console.warn("[firebase] Could not set persistence:",e.message))}const Y=zt;class xe extends Error{constructor(e,t,i=[]){super(e),this.name="ApiError",this.status=t,this.errors=i}}const qt="jdToken";function Yn(){return localStorage.getItem(qt)}function ee(s){s?localStorage.setItem(qt,s):localStorage.removeItem(qt)}const ul="/api";async function Xe(s,{body:e,...t}={}){const i=Yn(),r=await fetch(`${ul}${s}`,{headers:{"Content-Type":"application/json",...i&&{Authorization:`Bearer ${i}`}},body:e!==void 0?JSON.stringify(e):void 0,...t});if(r.status===204)return null;const a=await r.json().catch(()=>({}));if(!r.ok)throw r.status===401&&(ee(null),window.dispatchEvent(new CustomEvent("auth:logout"))),new xe(a.message||`HTTP ${r.status}`,r.status,a.errors??[]);return a}const F={get:(s,e)=>Xe(s,{method:"GET",...e}),post:(s,e,t)=>Xe(s,{method:"POST",body:e,...t}),put:(s,e,t)=>Xe(s,{method:"PUT",body:e,...t}),delete:(s,e)=>Xe(s,{method:"DELETE",...e})};function Hs(s){const t={"auth/user-not-found":"No account found with this email.","auth/wrong-password":"Incorrect password.","auth/invalid-credential":"Incorrect email or password.","auth/email-already-in-use":"An account with this email already exists.","auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"Enter a valid email address.","auth/too-many-requests":"Too many attempts — please try again later.","auth/network-request-failed":"Network error — check your connection.","auth/user-disabled":"This account has been disabled."}[s.code]??s.message??"Authentication failed.";return new xe(t,s.code==="auth/wrong-password"?401:400)}const Xn=u.createContext({user:null,loading:!0,applications:[],login:async()=>{},register:async()=>{},logout:async()=>{},signOut:async()=>{},saveApplication:async()=>{},updateApplicationStatus:async()=>{}});function hl({children:s}){const[e,t]=u.useState(null),[i,r]=u.useState(!0),[a,o]=u.useState([]);u.useEffect(()=>{if(Se&&Y)return Ya(Y,async N=>{if(N)try{const I=await N.getIdToken(),{token:p,user:x}=await F.post("/auth/firebase",{idToken:I});ee(p),t(x),await l()}catch{await Ct(Y).catch(()=>{}),ee(null),t(null),o([])}else ee(null),t(null),o([]);r(!1)});if(!Yn()){r(!1);return}F.get("/auth/me").then(({user:f})=>(t(f),l())).catch(()=>ee(null)).finally(()=>r(!1))},[]),u.useEffect(()=>{async function f(){Se&&Y&&await Ct(Y).catch(()=>{}),t(null),o([])}return window.addEventListener("auth:logout",f),()=>window.removeEventListener("auth:logout",f)},[]);async function l(){try{const{data:f}=await F.get("/users/applications?limit=100");o(f??[])}catch(f){console.warn("[auth] Could not load applications:",f.message)}}const c=u.useCallback(async(f,N)=>{if(Se&&Y){try{const k=await(await Wa(Y,f,N)).user.getIdToken(),{token:A,user:D}=await F.post("/auth/firebase",{idToken:k});ee(A),t(D),await l()}catch(x){throw x.code?Hs(x):x}return}const{token:I,user:p}=await F.post("/auth/login",{email:f,password:N});ee(I),t(p),await l()},[]),d=u.useCallback(async(f,N,I)=>{if(Se&&Y){try{const k=await Ha(Y,N,I);await qa(k.user,{displayName:f});const A=await k.user.getIdToken(!0),{token:D,user:L}=await F.post("/auth/firebase",{idToken:A});ee(D),t(L)}catch(k){throw k.code?Hs(k):k}return}const{token:p,user:x}=await F.post("/auth/register",{name:f,email:N,password:I});ee(p),t(x)},[]),_=u.useCallback(async()=>{Se&&Y?await Ct(Y).catch(()=>{}):await F.post("/auth/logout").catch(()=>{}),ee(null),t(null),o([])},[]),m=u.useCallback(async f=>{if(!e)return;const N=`temp-${Date.now()}`,I={...f,status:"pending",appliedAt:new Date().toISOString(),_id:N};o(p=>[...p.filter(x=>x.url!==f.url),I]);try{const{data:p}=await F.post("/users/applications",{company:f.company??"",role:f.role??"",location:f.location??"",salary:f.salary??"",type:f.type??"",url:f.url,status:"pending"});o(x=>[...x.filter(k=>k._id!==N),p])}catch(p){if(p instanceof xe&&p.status===409)return;o(x=>x.filter(k=>k._id!==N)),console.error("[auth] saveApplication failed:",p.message)}},[e]),w=u.useCallback(async(f,N)=>{if(!e)return;const I=a.find(p=>p.url===f);if(I){o(p=>p.map(x=>x.url===f?{...x,status:N}:x));try{await F.put(`/users/applications/${I._id}`,{status:N})}catch(p){o(x=>x.map(k=>k.url===f?{...k,status:I.status}:k)),console.error("[auth] updateApplicationStatus failed:",p.message)}}},[e,a]),b=_;return n.jsx(Xn.Provider,{value:{user:e,loading:i,applications:a,login:c,register:d,logout:_,signOut:b,saveApplication:m,updateApplicationStatus:w},children:s})}const Z=()=>u.useContext(Xn);function ml(){const{user:s,loading:e}=Z(),t=Js();return e?null:s?n.jsx(Gt,{}):n.jsx(Kt,{to:"/login",state:{from:t},replace:!0})}function pl(){const{user:s,loading:e}=Z();return e?null:!s||s.role!=="admin"?n.jsx(Kt,{to:"/",replace:!0}):n.jsx(Gt,{})}const fl="/api/jobs?limit=50&sort=newest",gl="https://remotive.com/api/remote-jobs?category=software-dev&limit=50",_l={"full-time":{label:"Full-time",cls:"type-badge--full"},"part-time":{label:"Part-time",cls:"type-badge--hybrid"},contract:{label:"Contract",cls:"type-badge--onsite"},internship:{label:"Internship",cls:"type-badge--hybrid"}};function vl(s){const e=_l[s.type]??{label:"Remote",cls:"type-badge--remote"};return{id:s._id,company:s.company||"Unknown",logoUrl:s.companyLogo||`https://ui-avatars.com/api/?name=${encodeURIComponent(s.company)}&background=6366f1&color=fff&size=36&bold=true`,role:s.title||"Open Position",dept:s.department||"Engineering",location:s.location||"Remote",salary:s.salary||"",salaryN:s.salaryMin||0,type:e,url:s.url||"#"}}const bl={full_time:{label:"Full-time",cls:"type-badge--full"},contract:{label:"Contract",cls:"type-badge--onsite"},part_time:{label:"Part-time",cls:"type-badge--hybrid"},freelance:{label:"Freelance",cls:"type-badge--hybrid"}},yl={"software-dev":"Engineering",design:"Design",marketing:"Marketing","customer-support":"Support",devops:"Infrastructure",product:"Product",data:"Data",sales:"Sales",writing:"Content"};function xl(s){var a,o;const e=bl[s.job_type]??{label:"Remote",cls:"type-badge--remote"},t=((a=s.salary)==null?void 0:a.trim())??"",i=t&&parseFloat(t.replace(/[^\d.]/g,""))||0,r=((o=s.company_logo_url)==null?void 0:o.trim())||`https://ui-avatars.com/api/?name=${encodeURIComponent(s.company_name)}&background=6366f1&color=fff&size=36&bold=true`;return{id:s.id,company:s.company_name||"Unknown",logoUrl:r,role:s.title||"Open Position",dept:yl[s.category]??"Engineering",location:s.candidate_required_location||"Remote",salary:t,salaryN:i,type:e,url:s.url||"#"}}function Nl(){const[s,e]=u.useState([]),[t,i]=u.useState(!0),[r,a]=u.useState(null),[o,l]=u.useState(null),[c,d]=u.useState(0);return u.useEffect(()=>{const m=new AbortController,w=setTimeout(()=>m.abort(),12e3);i(!0),a(null);const b=m.signal;fetch(fl,{signal:b}).then(N=>{if(!N.ok)throw new Error(`Backend ${N.status}`);return N.json()}).then(({data:N=[]})=>{if(N.length>0){e(N.map(vl)),l("backend"),i(!1);return}return f(b)}).catch(()=>{if(!b.aborted)return f(b)}).finally(()=>clearTimeout(w));async function f(N){try{const I=await fetch(gl,{signal:N});if(!I.ok)throw new Error(`HTTP ${I.status} — ${I.statusText}`);const{jobs:p=[]}=await I.json();e(p.map(xl)),l("remotive"),i(!1)}catch(I){I.name!=="AbortError"&&(a(I.message||"Failed to load jobs"),i(!1))}}return()=>{m.abort(),clearTimeout(w)}},[c]),{jobs:s,loading:t,error:r,source:o,refetch:()=>d(m=>m+1)}}const wl=[{id:"dashboard",to:"/",end:!0,icon:"dashboard",label:"Dashboard"},{id:"jobs",to:"/jobs",icon:"work_outline",label:"Jobs"},{id:"applications",to:"/applications",icon:"assignment",label:"Applications",badge:5},{id:"resume",to:"/resume",icon:"article",label:"Resume"},{id:"settings",to:"/settings",icon:"tune",label:"Settings"}],jl=[{id:"admin",to:"/admin",end:!0,icon:"admin_panel_settings",label:"Overview"},{id:"admin-users",to:"/admin/users",icon:"people",label:"Users"},{id:"admin-jobs",to:"/admin/jobs",icon:"work",label:"Manage Jobs"}];function Il({collapsed:s,mobileOpen:e,onClose:t}){var d;const{user:i,signOut:r}=Z(),a=(i==null?void 0:i.role)==="admin",o=(i==null?void 0:i.name)||((d=i==null?void 0:i.email)==null?void 0:d.split("@")[0])||"User",l=(i==null?void 0:i.avatar)||`https://ui-avatars.com/api/?name=${encodeURIComponent(o)}&background=6366f1&color=fff&size=36&bold=true`;function c(_){return n.jsx("li",{className:"sidebar__nav-item",children:n.jsxs(cs,{to:_.to,end:_.end,className:({isActive:m})=>`sidebar__nav-link${m?" sidebar__nav-link--active":""}`,"data-tooltip":_.label,onClick:()=>{e&&t()},children:[n.jsx("span",{className:"sidebar__nav-icon-wrap",children:n.jsx("span",{className:"material-icons",children:_.icon})}),n.jsx("span",{className:"sidebar__nav-label",children:_.label}),_.badge!=null&&n.jsx("span",{className:"badge",children:_.badge})]})},_.id)}return n.jsxs(n.Fragment,{children:[n.jsx("div",{className:`sidebar-backdrop ${e?"sidebar-backdrop--visible":""}`,onClick:t,"aria-hidden":"true"}),n.jsxs("aside",{className:["sidebar",s?"sidebar--collapsed":"",e?"sidebar--open":""].join(" "),children:[n.jsxs("div",{className:"sidebar__brand",children:[n.jsx("span",{className:"material-icons sidebar__brand-icon",children:"work"}),n.jsx("span",{className:"sidebar__brand-name",children:"JobHub"})]}),n.jsxs("nav",{className:"sidebar__nav","aria-label":"Primary navigation",children:[n.jsx("ul",{className:"sidebar__nav-list",children:wl.map(c)}),a&&n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"sidebar__section-divider",children:n.jsx("span",{className:"sidebar__section-label",children:"Admin"})}),n.jsx("ul",{className:"sidebar__nav-list",children:jl.map(c)})]})]}),n.jsxs("div",{className:"sidebar__footer",children:[i&&n.jsxs("div",{className:"sidebar__user",children:[n.jsx("img",{src:l,alt:o,className:"sidebar__user-avatar"}),n.jsxs("div",{className:"sidebar__user-info",children:[n.jsx("span",{className:"sidebar__user-name",children:o}),a&&n.jsx("span",{className:"sidebar__user-role",children:"Admin"})]})]}),n.jsxs(cs,{to:"/settings",className:({isActive:_})=>`sidebar__nav-link${_?" sidebar__nav-link--active":""}`,"data-tooltip":"Settings",onClick:()=>{e&&t()},children:[n.jsx("span",{className:"sidebar__nav-icon-wrap",children:n.jsx("span",{className:"material-icons",children:"account_circle"})}),n.jsx("span",{className:"sidebar__nav-label",children:"Profile"})]}),n.jsxs("button",{className:"sidebar__nav-link sidebar__nav-link--danger","data-tooltip":"Logout",onClick:r,children:[n.jsx("span",{className:"sidebar__nav-icon-wrap",children:n.jsx("span",{className:"material-icons",children:"logout"})}),n.jsx("span",{className:"sidebar__nav-label",children:"Logout"})]})]})]})]})}const El=[{id:1,icon:"event",iconCls:"notif-item__icon--blue",text:n.jsxs(n.Fragment,{children:["Interview scheduled at ",n.jsx("strong",{children:"Figma"})]}),time:"2 hours ago",unread:!0},{id:2,icon:"check_circle",iconCls:"notif-item__icon--green",text:n.jsxs(n.Fragment,{children:["Application ",n.jsx("strong",{children:"shortlisted"})," by Stripe"]}),time:"5 hours ago",unread:!0},{id:3,icon:"description",iconCls:"notif-item__icon--purple",text:n.jsxs(n.Fragment,{children:["Your resume was ",n.jsx("strong",{children:"viewed"})," by Vercel"]}),time:"Yesterday",unread:!1},{id:4,icon:"work",iconCls:"notif-item__icon--orange",text:n.jsx(n.Fragment,{children:"5 new jobs match your profile"}),time:"2 days ago",unread:!1}];function Sl({onSidebarToggle:s,jobs:e,onJobSelect:t}){var B;const{isDark:i,toggleTheme:r}=Yt(),{user:a,signOut:o}=Z(),[l,c]=u.useState(""),[d,_]=u.useState([]),[m,w]=u.useState(!1),[b,f]=u.useState(-1),N=u.useRef(null),[I,p]=u.useState(!1),[x,k]=u.useState(!1),[A,D]=u.useState(!1),L=u.useRef(null),S=u.useRef(null),v=(a==null?void 0:a.displayName)||((B=a==null?void 0:a.email)==null?void 0:B.split("@")[0])||"Alex Johnson",j=(a==null?void 0:a.photoURL)||`https://ui-avatars.com/api/?name=${encodeURIComponent(v)}&background=6366f1&color=fff&size=36&bold=true`;u.useEffect(()=>{const y=U=>{L.current&&!L.current.contains(U.target)&&p(!1),S.current&&!S.current.contains(U.target)&&k(!1)};return document.addEventListener("mousedown",y),()=>document.removeEventListener("mousedown",y)},[]),u.useEffect(()=>{const y=U=>{var W,O;(U.ctrlKey||U.metaKey)&&U.key==="k"&&(U.preventDefault(),(W=N.current)==null||W.focus(),(O=N.current)==null||O.select())};return document.addEventListener("keydown",y),()=>document.removeEventListener("keydown",y)},[]);const g=u.useCallback(y=>{if(c(y),f(-1),!y.trim()){_([]),w(!1);return}const U=y.toLowerCase(),W=e.filter(O=>[O.company,O.role,O.dept,O.location,O.type.label].some(Le=>Le.toLowerCase().includes(U))).slice(0,5);_(W),w(!0)},[e]);function T(y,U){return U?y.split(new RegExp(`(${U.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi")).map((O,Le)=>O.toLowerCase()===U.toLowerCase()?n.jsx("mark",{className:"search-mark",children:O},Le):O):y}const C=y=>{!m||!d.length||(y.key==="ArrowDown"?(y.preventDefault(),f(U=>Math.min(U+1,d.length-1))):y.key==="ArrowUp"?(y.preventDefault(),f(U=>Math.max(U-1,0))):y.key==="Enter"&&b>=0?(y.preventDefault(),R(d[b])):y.key==="Escape"&&M())},R=y=>{M(),t==null||t(y)},M=()=>{w(!1),c(""),_([]),f(-1)};return n.jsxs("header",{className:"navbar",children:[n.jsx("button",{className:"navbar__toggle",onClick:s,"aria-label":"Toggle sidebar",children:n.jsx("span",{className:"material-icons",children:"menu"})}),n.jsxs("div",{className:"navbar__search",children:[n.jsx("span",{className:"material-icons navbar__search-icon",children:"search"}),n.jsx("input",{ref:N,type:"text",className:"navbar__search-input",placeholder:"Search jobs, companies…",autoComplete:"off",value:l,onChange:y=>g(y.target.value),onKeyDown:C,onBlur:()=>setTimeout(()=>w(!1),150),onFocus:()=>{d.length&&w(!0)},"aria-label":"Search jobs"}),!l&&n.jsx("kbd",{className:"navbar__search-kbd",children:"Ctrl K"}),l&&n.jsx("button",{className:"navbar__search-clear",onClick:M,"aria-label":"Clear search",children:n.jsx("span",{className:"material-icons",children:"close"})}),m&&n.jsx("div",{className:"search-overlay",role:"listbox","aria-label":"Search results",children:d.length===0?n.jsxs("div",{className:"search-overlay__empty",children:[n.jsx("span",{className:"material-icons",children:"search_off"}),'No results for "',l,'"']}):n.jsxs(n.Fragment,{children:[d.map((y,U)=>n.jsxs("div",{role:"option",className:`search-result ${b===U?"search-result--focused":""}`,onMouseDown:W=>{W.preventDefault(),R(y)},children:[n.jsx("img",{src:y.logoUrl,alt:y.company,className:"search-result__logo",onError:W=>{W.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(y.company)}&background=6366f1&color=fff&size=32`}}),n.jsxs("div",{className:"search-result__info",children:[n.jsx("span",{className:"search-result__role",children:T(y.role,l)}),n.jsxs("span",{className:"search-result__meta",children:[T(y.company,l)," · ",y.location]})]}),n.jsx("span",{className:`type-badge ${y.type.cls}`,children:y.type.label})]},y.id)),n.jsx("div",{className:"search-overlay__footer",children:n.jsxs("button",{className:"search-overlay__see-all",onClick:M,children:[n.jsx("span",{className:"material-icons",children:"open_in_new"}),"See all results"]})})]})})]}),n.jsxs("div",{className:"navbar__actions",children:[n.jsxs("button",{className:"theme-toggle",role:"switch","aria-checked":i,"aria-label":"Toggle dark mode",onClick:r,children:[n.jsx("span",{className:"material-icons theme-toggle__icon--sun",children:"light_mode"}),n.jsx("span",{className:"theme-toggle__thumb"}),n.jsx("span",{className:"material-icons theme-toggle__icon--moon",children:"dark_mode"})]}),n.jsxs("div",{className:"navbar__notif-wrap",ref:L,children:[n.jsxs("button",{className:"navbar__icon-btn","aria-label":"Notifications","aria-expanded":I,onClick:()=>{p(y=>!y),k(!1)},children:[n.jsx("span",{className:"material-icons",children:"notifications_none"}),!A&&n.jsx("span",{className:"navbar__notif-dot"})]}),I&&n.jsxs("div",{className:"notif-panel",children:[n.jsxs("div",{className:"notif-panel__head",children:[n.jsx("span",{className:"notif-panel__title",children:"Notifications"}),n.jsx("button",{className:"notif-panel__mark-all",onClick:()=>D(!0),children:"Mark all read"})]}),n.jsx("ul",{className:"notif-list",children:El.map(y=>n.jsxs("li",{className:`notif-item ${y.unread&&!A?"notif-item--unread":""}`,children:[n.jsx("div",{className:`notif-item__icon ${y.iconCls}`,children:n.jsx("span",{className:"material-icons",children:y.icon})}),n.jsxs("div",{className:"notif-item__body",children:[n.jsx("p",{className:"notif-item__text",children:y.text}),n.jsx("span",{className:"notif-item__time",children:y.time})]}),y.unread&&!A&&n.jsx("span",{className:"notif-item__unread-dot"})]},y.id))}),n.jsx("div",{className:"notif-panel__footer",children:n.jsx("a",{href:"#",className:"notif-panel__view-all",children:"View all notifications"})})]})]}),n.jsx("div",{className:"navbar__divider"}),n.jsxs("div",{className:"navbar__user-wrap",ref:S,children:[n.jsxs("button",{className:"navbar__user","aria-expanded":x,onClick:()=>{k(y=>!y),p(!1)},children:[n.jsx("img",{src:j,alt:v,className:"navbar__avatar"}),n.jsxs("div",{className:"navbar__user-info",children:[n.jsx("span",{className:"navbar__user-name",children:v}),n.jsx("span",{className:"navbar__user-role",children:"Job Seeker"})]}),n.jsx("span",{className:`material-icons navbar__user-caret ${x?"navbar__user-caret--open":""}`,children:"expand_more"})]}),x&&n.jsxs("div",{className:"user-panel",children:[n.jsxs("div",{className:"user-panel__head",children:[n.jsx("img",{src:j,alt:v,className:"user-panel__avatar"}),n.jsxs("div",{className:"user-panel__info",children:[n.jsx("span",{className:"user-panel__name",children:v}),n.jsx("span",{className:"user-panel__email",children:(a==null?void 0:a.email)||"demo@jobhub.io"})]})]}),n.jsxs("ul",{className:"user-panel__menu",children:[[{icon:"person_outline",label:"My Profile"},{icon:"article",label:"My Resume"},{icon:"tune",label:"Settings"}].map(y=>n.jsx("li",{children:n.jsxs("a",{href:"#",className:"user-panel__link",children:[n.jsx("span",{className:"material-icons",children:y.icon}),y.label]})},y.label)),n.jsx("li",{className:"user-panel__divider"}),n.jsx("li",{children:n.jsxs("button",{className:"user-panel__link user-panel__link--danger",onClick:o,children:[n.jsx("span",{className:"material-icons",children:"logout"}),"Sign out"]})})]})]})]})]})]})}function kl(){const{jobs:s,loading:e,error:t,refetch:i}=Nl(),r=Jt(),[a,o]=u.useState(!1),[l,c]=u.useState(!1),[d,_]=u.useState(null),m=()=>{window.innerWidth<=768?c(f=>!f):o(f=>!f)},w=()=>c(!1),b=u.useCallback(f=>{_(f),r("/")},[r]);return n.jsxs("div",{className:"app-layout",children:[n.jsx(Il,{collapsed:a,mobileOpen:l,onClose:w}),n.jsxs("div",{className:["main-wrapper",a?"":"main-wrapper--expanded"].join(" "),children:[n.jsx(Sl,{onSidebarToggle:m,jobs:s,onJobSelect:b}),n.jsx("main",{className:"content",children:n.jsx(Gt,{context:{jobs:s,loading:e,error:t,refetch:i,selectedJob:d}})})]})]})}function Cl(){var j,g,T;const{login:s,register:e}=Z(),t=Jt(),i=Js(),r=((g=(j=i.state)==null?void 0:j.from)==null?void 0:g.pathname)||"/",[a,o]=u.useState("login"),[l,c]=u.useState(!1),[d,_]=u.useState(!1),[m,w]=u.useState({name:"",email:"",password:""}),[b,f]=u.useState({}),[N,I]=u.useState(""),[p,x]=u.useState(((T=i.state)==null?void 0:T.successMessage)||""),k=u.useCallback(C=>R=>{w(M=>({...M,[C]:R.target.value})),f(M=>{const B={...M};return delete B[C],B}),I("")},[]);function A(C){o(C),f({}),I(""),x(""),_(!1)}function D(){const C={};return a==="register"&&(m.name.trim()?m.name.trim().length>80&&(C.name="Name cannot exceed 80 characters"):C.name="Name is required"),m.email.trim()?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)||(C.email="Enter a valid email"):C.email="Email is required",m.password?a==="register"&&m.password.length<8&&(C.password="Password must be at least 8 characters"):C.password="Password is required",f(C),Object.keys(C).length===0}async function L(C){var R;if(C.preventDefault(),!!D()){c(!0),I("");try{a==="login"?await s(m.email,m.password):await e(m.name,m.email,m.password),t(r,{replace:!0})}catch(M){if(M instanceof xe&&((R=M.errors)!=null&&R.length)){const B={};M.errors.forEach(({path:y,msg:U})=>{B[y]=U}),f(B)}else I(M instanceof xe?M.message:"Something went wrong — please try again.")}finally{c(!1)}}}async function S(C){if(C.preventDefault(),!m.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)){f({email:"Enter a valid email"});return}c(!0),I("");try{await F.post("/auth/forgot-password",{email:m.email}),x("If that email is registered you will receive a reset link shortly.")}catch(R){I(R instanceof xe?R.message:"Something went wrong.")}finally{c(!1)}}const v=a==="forgot";return n.jsx("div",{className:"login-page",children:n.jsxs("div",{className:"login-card",children:[n.jsxs("div",{className:"login-brand",children:[n.jsx("div",{className:"login-brand__icon",children:n.jsx("span",{className:"material-icons",children:"work"})}),n.jsxs("div",{children:[n.jsx("div",{className:"login-brand__name",children:"JobDash"}),n.jsx("div",{className:"login-brand__tagline",children:"Your career command center"})]})]}),!v&&n.jsxs("div",{className:"login-tabs",children:[n.jsx("button",{type:"button",className:`login-tabs__btn${a==="login"?" login-tabs__btn--active":""}`,onClick:()=>A("login"),children:"Sign In"}),n.jsx("button",{type:"button",className:`login-tabs__btn${a==="register"?" login-tabs__btn--active":""}`,onClick:()=>A("register"),children:"Create Account"})]}),v&&n.jsxs("div",{children:[n.jsxs("button",{type:"button",className:"login-back-btn",onClick:()=>A("login"),children:[n.jsx("span",{className:"material-icons",children:"arrow_back"})," Back to sign in"]}),n.jsx("h2",{className:"login-section-title",children:"Reset your password"}),n.jsx("p",{className:"login-section-sub",children:"Enter your email and we'll send you a reset link."})]}),p&&n.jsxs("div",{className:"login-success",children:[n.jsx("span",{className:"material-icons",children:"check_circle"}),p]}),v&&!p&&n.jsxs("form",{className:"login-form",onSubmit:S,noValidate:!0,children:[N&&n.jsxs("div",{className:"login-error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),N]}),n.jsxs("div",{className:"login-field",children:[n.jsx("label",{className:"login-field__label",htmlFor:"lp-fp-email",children:"Email address"}),n.jsx("div",{className:"login-field__input-wrap",children:n.jsx("input",{id:"lp-fp-email",type:"email",className:`login-field__input${b.email?" login-field__input--error":""}`,placeholder:"jane@example.com",value:m.email,onChange:k("email"),autoComplete:"email",disabled:l,autoFocus:!0})}),b.email&&n.jsxs("span",{className:"login-field__error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),b.email]})]}),n.jsx("button",{type:"submit",className:"login-submit",disabled:l,children:l?n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"login-submit__spinner"})," Sending link…"]}):"Send Reset Link"})]}),!v&&n.jsxs("form",{className:"login-form",onSubmit:L,noValidate:!0,children:[N&&n.jsxs("div",{className:"login-error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),N]}),a==="register"&&n.jsxs("div",{className:"login-field",children:[n.jsx("label",{className:"login-field__label",htmlFor:"lp-name",children:"Full Name"}),n.jsx("div",{className:"login-field__input-wrap",children:n.jsx("input",{id:"lp-name",type:"text",className:`login-field__input${b.name?" login-field__input--error":""}`,placeholder:"Jane Smith",value:m.name,onChange:k("name"),autoComplete:"name",disabled:l})}),b.name&&n.jsxs("span",{className:"login-field__error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),b.name]})]}),n.jsxs("div",{className:"login-field",children:[n.jsx("label",{className:"login-field__label",htmlFor:"lp-email",children:"Email"}),n.jsx("div",{className:"login-field__input-wrap",children:n.jsx("input",{id:"lp-email",type:"email",className:`login-field__input${b.email?" login-field__input--error":""}`,placeholder:"jane@example.com",value:m.email,onChange:k("email"),autoComplete:"email",disabled:l})}),b.email&&n.jsxs("span",{className:"login-field__error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),b.email]})]}),n.jsxs("div",{className:"login-field",children:[n.jsxs("div",{className:"login-field__label-row",children:[n.jsx("label",{className:"login-field__label",htmlFor:"lp-password",children:"Password"}),a==="login"&&n.jsx("button",{type:"button",className:"login-forgot-link",onClick:()=>A("forgot"),children:"Forgot password?"})]}),n.jsxs("div",{className:"login-field__input-wrap",children:[n.jsx("input",{id:"lp-password",type:d?"text":"password",className:`login-field__input login-field__input--has-toggle${b.password?" login-field__input--error":""}`,placeholder:a==="register"?"Min. 8 characters":"••••••••",value:m.password,onChange:k("password"),autoComplete:a==="register"?"new-password":"current-password",disabled:l}),n.jsx("button",{type:"button",className:"login-field__toggle",onClick:()=>_(C=>!C),tabIndex:-1,"aria-label":d?"Hide password":"Show password",children:n.jsx("span",{className:"material-icons",children:d?"visibility_off":"visibility"})})]}),b.password&&n.jsxs("span",{className:"login-field__error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),b.password]})]}),n.jsx("button",{type:"submit",className:"login-submit",disabled:l,children:l?n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"login-submit__spinner"})," ",a==="login"?"Signing in…":"Creating account…"]}):a==="login"?"Sign In":"Create Account"})]}),!v&&n.jsx("p",{className:"login-footer",children:a==="login"?n.jsxs(n.Fragment,{children:["Don't have an account?"," ",n.jsx("button",{type:"button",className:"login-footer__link",onClick:()=>A("register"),children:"Create one"})]}):n.jsxs(n.Fragment,{children:["Already have an account?"," ",n.jsx("button",{type:"button",className:"login-footer__link",onClick:()=>A("login"),children:"Sign in"})]})})]})})}function Tl(){const s=Jt(),[e]=ii(),t=e.get("token"),[i,r]=u.useState(""),[a,o]=u.useState(""),[l,c]=u.useState(!1),[d,_]=u.useState(!1),[m,w]=u.useState({}),[b,f]=u.useState("");if(!t)return n.jsx("div",{className:"login-page",children:n.jsxs("div",{className:"login-card",children:[n.jsxs("div",{className:"login-brand",children:[n.jsx("div",{className:"login-brand__icon",children:n.jsx("span",{className:"material-icons",children:"work"})}),n.jsx("div",{children:n.jsx("div",{className:"login-brand__name",children:"JobDash"})})]}),n.jsxs("div",{className:"login-error",style:{marginTop:0},children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),"Invalid reset link. Please request a new one."]}),n.jsx("p",{className:"login-footer",children:n.jsx("button",{type:"button",className:"login-footer__link",onClick:()=>s("/login",{state:{view:"forgot"}}),children:"Request password reset"})})]})});function N(){const p={};return i?i.length<8&&(p.password="Password must be at least 8 characters"):p.password="Password is required",a?a!==i&&(p.confirm="Passwords do not match"):p.confirm="Please confirm your password",w(p),Object.keys(p).length===0}async function I(p){if(p.preventDefault(),!!N()){_(!0),f("");try{await F.post("/auth/reset-password",{token:t,password:i}),s("/login",{replace:!0,state:{successMessage:"Password reset successfully. Please sign in."}})}catch(x){f(x instanceof xe?x.message:"Something went wrong — please try again.")}finally{_(!1)}}}return n.jsx("div",{className:"login-page",children:n.jsxs("div",{className:"login-card",children:[n.jsxs("div",{className:"login-brand",children:[n.jsx("div",{className:"login-brand__icon",children:n.jsx("span",{className:"material-icons",children:"work"})}),n.jsxs("div",{children:[n.jsx("div",{className:"login-brand__name",children:"JobDash"}),n.jsx("div",{className:"login-brand__tagline",children:"Your career command center"})]})]}),n.jsxs("div",{children:[n.jsx("h2",{className:"login-section-title",children:"Set a new password"}),n.jsx("p",{className:"login-section-sub",children:"Choose a strong password for your account."})]}),n.jsxs("form",{className:"login-form",onSubmit:I,noValidate:!0,children:[b&&n.jsxs("div",{className:"login-error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),b]}),n.jsxs("div",{className:"login-field",children:[n.jsx("label",{className:"login-field__label",htmlFor:"rp-password",children:"New Password"}),n.jsxs("div",{className:"login-field__input-wrap",children:[n.jsx("input",{id:"rp-password",type:l?"text":"password",className:`login-field__input login-field__input--has-toggle${m.password?" login-field__input--error":""}`,placeholder:"Min. 8 characters",value:i,onChange:p=>{r(p.target.value),w(x=>({...x,password:""}))},autoComplete:"new-password",disabled:d,autoFocus:!0}),n.jsx("button",{type:"button",className:"login-field__toggle",onClick:()=>c(p=>!p),tabIndex:-1,"aria-label":l?"Hide password":"Show password",children:n.jsx("span",{className:"material-icons",children:l?"visibility_off":"visibility"})})]}),m.password&&n.jsxs("span",{className:"login-field__error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),m.password]})]}),n.jsxs("div",{className:"login-field",children:[n.jsx("label",{className:"login-field__label",htmlFor:"rp-confirm",children:"Confirm Password"}),n.jsx("div",{className:"login-field__input-wrap",children:n.jsx("input",{id:"rp-confirm",type:l?"text":"password",className:`login-field__input${m.confirm?" login-field__input--error":""}`,placeholder:"Repeat your password",value:a,onChange:p=>{o(p.target.value),w(x=>({...x,confirm:""}))},autoComplete:"new-password",disabled:d})}),m.confirm&&n.jsxs("span",{className:"login-field__error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),m.confirm]})]}),n.jsx("button",{type:"submit",className:"login-submit",disabled:d,children:d?n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"login-submit__spinner"})," Updating password…"]}):"Set New Password"})]}),n.jsxs("p",{className:"login-footer",children:["Remember it?"," ",n.jsx("button",{type:"button",className:"login-footer__link",onClick:()=>s("/login"),children:"Sign in"})]})]})})}function Al(s,e=1200){const[t,i]=u.useState(0),r=u.useRef(null),a=u.useRef(!1);return u.useEffect(()=>{const o=r.current;if(!o)return;a.current=!1,i(0);let l;const c=new IntersectionObserver(([d])=>{if(!d.isIntersecting||a.current)return;a.current=!0,c.disconnect();let _;const m=w=>{_||(_=w);const b=Math.min((w-_)/e,1),f=1-Math.pow(1-b,3);i(Math.round(f*s)),b<1&&(l=requestAnimationFrame(m))};l=requestAnimationFrame(m)},{threshold:.2});return c.observe(o),()=>{c.disconnect(),cancelAnimationFrame(l)}},[s,e]),[t,r]}function Rl(s){const[e,t]=u.useState("0%");return u.useEffect(()=>{const i=setTimeout(()=>t(s),150);return()=>clearTimeout(i)},[s]),e}function Pl({colorClass:s,icon:e,target:t,label:i,meta:r,barPct:a,badgeDir:o,badgeVal:l}){const[c,d]=Al(t),_=Rl(a);return n.jsxs("div",{className:`stat-card ${s}`,children:[n.jsxs("div",{className:"stat-card__header",children:[n.jsx("div",{className:"stat-card__icon-wrap",children:n.jsx("span",{className:"material-icons",children:e})}),n.jsxs("span",{className:`stat-card__badge stat-card__badge--${o}`,children:[n.jsx("span",{className:"material-icons",children:o==="up"?"arrow_upward":"arrow_downward"}),l]})]}),n.jsxs("div",{className:"stat-card__body",children:[n.jsx("span",{className:"stat-card__value",ref:d,children:c}),n.jsx("span",{className:"stat-card__label",children:i})]}),n.jsxs("div",{className:"stat-card__footer",children:[n.jsx("span",{className:"stat-card__meta",children:r}),n.jsx("div",{className:"stat-card__bar-wrap",children:n.jsx("div",{className:"stat-card__bar",style:{width:_}})})]})]})}function Ol(){const{applications:s}=Z(),e=s.length,t=s.filter(l=>l.status==="interview").length,i=s.filter(l=>l.status==="pending").length,r=s.filter(l=>l.status==="rejected").length,a=e===0,o=[{colorClass:"stat-card--indigo",icon:"send",target:a?48:e,label:"Jobs Applied",meta:a?"+5 from last month":`${e} total applications`,barPct:a?"62%":`${Math.min(100,e*2)}%`,badgeDir:"up",badgeVal:"12%"},{colorClass:"stat-card--green",icon:"event_available",target:a?6:t,label:"Interviews",meta:a?"12.5% interview rate":`${e?Math.round(t/e*100):0}% interview rate`,barPct:a?"13%":`${e?Math.round(t/e*100):0}%`,badgeDir:"up",badgeVal:"8%"},{colorClass:"stat-card--amber",icon:"hourglass_top",target:a?14:i,label:"Pending",meta:a?"29% awaiting response":`${e?Math.round(i/e*100):0}% awaiting response`,barPct:a?"29%":`${e?Math.round(i/e*100):0}%`,badgeDir:"up",badgeVal:"5%"},{colorClass:"stat-card--red",icon:"cancel",target:a?9:r,label:"Rejected",meta:a?"19% rejection rate":`${e?Math.round(r/e*100):0}% rejection rate`,barPct:a?"19%":`${e?Math.round(r/e*100):0}%`,badgeDir:"down",badgeVal:"3%"}];return n.jsx("section",{className:"stats-grid","aria-label":"Application statistics",children:o.map(l=>n.jsx(Pl,{...l},l.label))})}function Dl({job:s,isApplied:e,onApply:t,highlight:i}){const r=/remote|worldwide|anywhere/i.test(s.location)?"public":"location_on",a=`https://ui-avatars.com/api/?name=${encodeURIComponent(s.company)}&background=6366f1&color=fff&size=36&bold=true`;return n.jsxs("tr",{className:"jobs-row",children:[n.jsx("td",{"data-label":"Company",children:n.jsxs("div",{className:"co-cell",children:[n.jsx("img",{src:s.logoUrl,alt:s.company,className:"co-cell__logo",onError:o=>{o.target.onerror=null,o.target.src=a}}),n.jsx("span",{className:"co-cell__name",children:At(s.company,i)})]})}),n.jsx("td",{"data-label":"Role",children:n.jsxs("div",{className:"role-cell",children:[n.jsx("span",{className:"role-cell__title",children:At(s.role,i)}),n.jsx("span",{className:"role-cell__dept",children:At(s.dept,i)})]})}),n.jsx("td",{"data-label":"Location",children:n.jsxs("div",{className:"loc-cell",children:[n.jsx("span",{className:"material-icons",children:r}),s.location]})}),n.jsx("td",{"data-label":"Salary","data-value":s.salaryN,children:s.salary?n.jsx("span",{className:"salary",children:s.salary}):n.jsx("span",{className:"salary--na",children:"—"})}),n.jsx("td",{"data-label":"Type",children:n.jsx("span",{className:`type-badge ${s.type.cls}`,children:s.type.label})}),n.jsx("td",{children:e?n.jsxs("button",{className:"apply-btn apply-btn--applied",disabled:!0,children:[n.jsx("span",{className:"material-icons",children:"check_circle"}),"Applied"]}):n.jsxs("button",{className:"apply-btn",onClick:()=>t(s),children:[n.jsx("span",{className:"material-icons",children:"open_in_new"}),"Apply"]})})]})}function At(s,e){if(!e||!s)return s;const t=e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),i=s.split(new RegExp(`(${t})`,"gi"));return i.length===1?s:i.map((r,a)=>r.toLowerCase()===e.toLowerCase()?n.jsx("mark",{className:"search-mark",children:r},a):r)}const Ee=8;function Ll(){return n.jsxs("tr",{className:"jobs-skeleton",children:[n.jsx("td",{children:n.jsxs("div",{className:"sk-cell",children:[n.jsx("div",{className:"shimmer sk-logo"}),n.jsx("div",{className:"shimmer sk-text",style:{width:72}})]})}),n.jsxs("td",{children:[n.jsx("div",{className:"shimmer sk-text",style:{width:110}}),n.jsx("div",{className:"shimmer sk-text",style:{width:60,marginTop:5}})]}),n.jsx("td",{children:n.jsx("div",{className:"shimmer sk-text",style:{width:96}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer sk-text",style:{width:84}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer sk-badge"})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer sk-btn"})})]})}function Rt({col:s,activeSortCol:e,activeSortDir:t}){return s!==e?n.jsx("span",{className:"material-icons sort-icon",children:"unfold_more"}):n.jsx("span",{className:"material-icons sort-icon sort-icon--active",children:t===1?"arrow_upward":"arrow_downward"})}function Qn({jobs:s,loading:e,error:t,onRetry:i,highlight:r}){const{applications:a,saveApplication:o}=Z(),[l,c]=u.useState(""),[d,_]=u.useState(null),[m,w]=u.useState(1),[b,f]=u.useState(1),N=u.useRef(null),I=u.useMemo(()=>new Set(a.map(j=>j.url)),[a]),p=u.useMemo(()=>{let j=[...s];if(l){const g=l.toLowerCase();j=j.filter(T=>[T.company,T.role,T.dept,T.location,T.type.label].some(C=>C.toLowerCase().includes(g)))}return d!==null&&j.sort((g,T)=>{let C,R;return d==="company"&&(C=g.company,R=T.company),d==="role"&&(C=g.role,R=T.role),d==="salaryN"&&(C=g.salaryN,R=T.salaryN),typeof C=="string"?m*C.localeCompare(R):m*((C??0)-(R??0))}),j},[s,l,d,m]),x=Math.ceil(p.length/Ee),k=p.slice((b-1)*Ee,b*Ee),A=j=>{c(j.target.value),f(1)},D=j=>{w(d===j?-m:1),_(j),f(1)},L=j=>{var g;f(j),(g=N.current)==null||g.scrollIntoView({behavior:"smooth",block:"start"})},S=j=>{j.url&&j.url!=="#"&&window.open(j.url,"_blank","noopener,noreferrer"),o({company:j.company,role:j.role,location:j.location,salary:j.salary,type:j.type.label,url:j.url})};function v(j,g){if(g<=7)return Array.from({length:g},(U,W)=>W+1);const T=3,C=Math.floor(T/2);let R=Math.max(2,j-C),M=Math.min(g-1,R+T-1);M===g-1&&(R=Math.max(2,M-T+1));const B=Array.from({length:M-R+1},(U,W)=>R+W),y=[1];return R>2&&y.push(null),y.push(...B),M<g-1&&y.push(null),y.push(g),y}return n.jsx("section",{className:"jobs-section",ref:N,children:n.jsxs("div",{className:"card",children:[n.jsxs("div",{className:"jobs-toolbar",children:[n.jsxs("div",{className:"jobs-toolbar__left",children:[n.jsx("h2",{className:"jobs-toolbar__title",children:"Available Jobs"}),n.jsx("span",{className:"jobs-toolbar__count",children:e?"Loading…":l?`${p.length} result${p.length!==1?"s":""}`:`${s.length} positions`}),!e&&!t&&s.length>0&&n.jsxs("span",{className:"api-indicator",title:"Live data from Remotive API",children:[n.jsx("span",{className:"api-indicator__dot"}),"Live"]})]}),n.jsxs("div",{className:"jobs-toolbar__right",children:[n.jsxs("div",{className:"jobs-search",children:[n.jsx("span",{className:"material-icons jobs-search__icon",children:"search"}),n.jsx("input",{type:"text",className:"jobs-search__input",placeholder:"Filter by company or role…",value:l,onChange:A,autoComplete:"off"})]}),n.jsxs("button",{className:"jobs-filter-btn",children:[n.jsx("span",{className:"material-icons",children:"tune"}),n.jsx("span",{children:"Filter"})]})]})]}),n.jsx("div",{className:"jobs-table-wrap",children:n.jsxs("table",{className:"jobs-table",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsxs("th",{onClick:()=>D("company"),style:{cursor:"pointer"},children:["Company ",n.jsx(Rt,{col:"company",activeSortCol:d,activeSortDir:m})]}),n.jsxs("th",{onClick:()=>D("role"),style:{cursor:"pointer"},children:["Role ",n.jsx(Rt,{col:"role",activeSortCol:d,activeSortDir:m})]}),n.jsx("th",{children:"Location"}),n.jsxs("th",{onClick:()=>D("salaryN"),style:{cursor:"pointer"},children:["Salary ",n.jsx(Rt,{col:"salaryN",activeSortCol:d,activeSortDir:m})]}),n.jsx("th",{children:"Type"}),n.jsx("th",{})]})}),n.jsxs("tbody",{id:"jobsBody",children:[e&&Array.from({length:Ee},(j,g)=>n.jsx(Ll,{},g)),!e&&t&&n.jsx("tr",{children:n.jsx("td",{colSpan:6,children:n.jsxs("div",{className:"fetch-error",children:[n.jsx("span",{className:"material-icons fetch-error__icon",children:"cloud_off"}),n.jsx("p",{className:"fetch-error__title",children:"Could not load live jobs"}),n.jsx("p",{className:"fetch-error__msg",children:t}),n.jsxs("button",{className:"btn btn--primary btn--sm",onClick:i,children:[n.jsx("span",{className:"material-icons",children:"refresh"}),"Retry"]})]})})}),!e&&!t&&k.length===0&&n.jsx("tr",{children:n.jsx("td",{colSpan:6,children:n.jsxs("div",{className:"jobs-table__empty",children:[n.jsx("span",{className:"material-icons",children:"search_off"}),l?n.jsxs(n.Fragment,{children:['No jobs match "',n.jsx("strong",{children:l}),'"']}):"No jobs available"]})})}),!e&&!t&&k.map(j=>n.jsx(Dl,{job:j,isApplied:I.has(j.url),onApply:S,highlight:l||r},j.id))]})]})}),!e&&!t&&x>1&&n.jsxs("div",{className:"jobs-pagination",children:[n.jsxs("span",{className:"jobs-pagination__info",children:["Showing ",(b-1)*Ee+1,"–",Math.min(b*Ee,p.length)," of ",p.length," positions"]}),n.jsxs("div",{className:"jobs-pagination__pages",children:[n.jsx("button",{className:"page-btn",disabled:b<=1,onClick:()=>L(b-1),"aria-label":"Previous page",children:n.jsx("span",{className:"material-icons",children:"chevron_left"})}),v(b,x).map((j,g)=>j===null?n.jsx("span",{className:"page-dots",children:"···"},`dot-${g}`):n.jsx("button",{className:`page-btn ${j===b?"page-btn--active":""}`,onClick:()=>L(j),children:j},j)),n.jsx("button",{className:"page-btn",disabled:b>=x,onClick:()=>L(b+1),"aria-label":"Next page",children:n.jsx("span",{className:"material-icons",children:"chevron_right"})})]})]})]})})}function Ml(){const{jobs:s,loading:e,error:t,refetch:i,selectedJob:r}=Ys();return n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"content__header",children:[n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Dashboard"}),n.jsx("p",{className:"content__subtitle",children:"Here's your job hunt at a glance."})]}),n.jsxs("button",{className:"btn btn--primary",children:[n.jsx("span",{className:"material-icons",children:"add"}),"New Application"]})]}),n.jsx(Ol,{}),n.jsx(Qn,{jobs:s,loading:e,error:t,onRetry:i,highlight:(r==null?void 0:r.company)||""})]})}function Ul(){const{jobs:s,loading:e,error:t,refetch:i,selectedJob:r}=Ys();return n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"content__header",children:n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Browse Jobs"}),n.jsx("p",{className:"content__subtitle",children:e?"Loading live positions…":`${s.length} remote positions available right now.`})]})}),n.jsx(Qn,{jobs:s,loading:e,error:t,onRetry:i,highlight:(r==null?void 0:r.company)||""})]})}const Fl=[{company:"Stripe",role:"Frontend Engineer",location:"Remote",salary:"$140k–$170k",type:"Full-time",url:"#",status:"interview",appliedAt:"2026-01-15"},{company:"Vercel",role:"React Developer",location:"Remote",salary:"$130k–$160k",type:"Full-time",url:"#",status:"pending",appliedAt:"2026-01-18"},{company:"Figma",role:"UI Engineer",location:"San Francisco, CA",salary:"$150k–$180k",type:"Full-time",url:"#",status:"offer",appliedAt:"2026-01-20"},{company:"Linear",role:"Product Engineer",location:"Remote",salary:"$120k–$145k",type:"Full-time",url:"#",status:"rejected",appliedAt:"2026-01-22"},{company:"Loom",role:"Software Engineer",location:"Remote",salary:"$115k–$140k",type:"Contract",url:"#",status:"pending",appliedAt:"2026-01-25"}],Qe={pending:{label:"Pending",cls:"apps-status--pending"},interview:{label:"Interview",cls:"apps-status--interview"},offer:{label:"Offer",cls:"apps-status--offer"},rejected:{label:"Rejected",cls:"apps-status--rejected"}},Ws=["pending","interview","offer","rejected"];function $l(){const{applications:s,updateApplicationStatus:e}=Z(),t=s.length>0?s:Fl,i=s.length===0,r=a=>{if(!a)return"—";try{return(a.toDate?a.toDate():new Date(a)).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}catch{return"—"}};return n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"content__header",children:[n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Applications"}),n.jsx("p",{className:"content__subtitle",children:i?"Demo data — apply to jobs on the Dashboard to track real applications.":`${s.length} application${s.length!==1?"s":""} tracked.`})]}),i&&n.jsxs("span",{className:"apps-demo-badge",children:[n.jsx("span",{className:"material-icons",children:"info_outline"}),"Demo"]})]}),n.jsxs("div",{className:"card",children:[n.jsx("div",{className:"apps-stats",children:Ws.map(a=>{const o=t.filter(c=>c.status===a).length,l=Qe[a];return n.jsxs("div",{className:`apps-stat apps-stat--${a}`,children:[n.jsx("span",{className:"apps-stat__count",children:o}),n.jsx("span",{className:"apps-stat__label",children:l.label})]},a)})}),n.jsx("div",{className:"apps-table-wrap",children:n.jsxs("table",{className:"apps-table",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{children:"Company"}),n.jsx("th",{children:"Role"}),n.jsx("th",{children:"Location"}),n.jsx("th",{children:"Salary"}),n.jsx("th",{children:"Type"}),n.jsx("th",{children:"Applied"}),n.jsx("th",{children:"Status"}),n.jsx("th",{})]})}),n.jsx("tbody",{children:t.map((a,o)=>{const l=Qe[a.status]||Qe.pending;return n.jsxs("tr",{className:"apps-row",children:[n.jsx("td",{children:n.jsxs("div",{className:"apps-company",children:[n.jsx("img",{src:`https://logo.clearbit.com/${a.company.toLowerCase().replace(/\s+/g,"")}.com`,alt:a.company,className:"apps-company__logo",onError:c=>{c.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(a.company)}&background=6366f1&color=fff&size=32`}}),n.jsx("span",{className:"apps-company__name",children:a.company})]})}),n.jsx("td",{className:"apps-role",children:a.role}),n.jsxs("td",{className:"apps-location",children:[n.jsx("span",{className:"material-icons",style:{fontSize:14,marginRight:3,verticalAlign:"middle",opacity:.6},children:"location_on"}),a.location]}),n.jsx("td",{className:"apps-salary",children:a.salary||"—"}),n.jsx("td",{children:n.jsx("span",{className:"type-badge type-badge--full-time",children:a.type})}),n.jsx("td",{className:"apps-date",children:r(a.appliedAt)}),n.jsx("td",{children:n.jsx("select",{className:`apps-status ${l.cls}`,value:a.status||"pending",onChange:c=>e(a.url,c.target.value),disabled:i,children:Ws.map(c=>n.jsx("option",{value:c,children:Qe[c].label},c))})}),n.jsx("td",{children:a.url&&a.url!=="#"&&n.jsx("a",{href:a.url,target:"_blank",rel:"noopener noreferrer",className:"apps-link",title:"View job posting",children:n.jsx("span",{className:"material-icons",children:"open_in_new"})})})]},a.url+o)})})]})}),t.length===0&&n.jsxs("div",{className:"content__placeholder",style:{minHeight:240},children:[n.jsx("span",{className:"material-icons",children:"assignment_late"}),n.jsx("h2",{children:"No applications yet"}),n.jsx("p",{children:"Click Apply on any job in the Dashboard or Jobs page to start tracking."})]})]})]})}const Bl=10*1024*1024;function Vl(){const[s,e]=u.useState(null),[t,i]=u.useState(null),[r,a]=u.useState(!1),[o,l]=u.useState(!1),[c,d]=u.useState(0),[_,m]=u.useState(""),w=u.useRef(null),b=u.useRef(0),f=u.useRef(null);u.useEffect(()=>()=>{t!=null&&t.startsWith("blob:")&&URL.revokeObjectURL(t)},[t]),u.useEffect(()=>()=>{f.current&&clearInterval(f.current)},[]);const N=u.useCallback(S=>{if(m(""),S.type!=="application/pdf"){m("Only PDF files are supported.");return}if(S.size>Bl){m("File must be smaller than 10 MB.");return}t!=null&&t.startsWith("blob:")&&URL.revokeObjectURL(t),e(S),i(URL.createObjectURL(S)),l(!0),d(0);let v=0;f.current=setInterval(()=>{if(v+=Math.random()*18+5,v>=100){clearInterval(f.current),d(100),l(!1);return}d(v)},160)},[t]),I=S=>{S.preventDefault(),a(!1),b.current=0;const v=S.dataTransfer.files[0];v&&N(v)},p=S=>S.preventDefault(),x=S=>{S.preventDefault(),b.current++,a(!0)},k=()=>{b.current--,b.current===0&&a(!1)},A=S=>{const v=S.target.files[0];v&&N(v),S.target.value=""},D=()=>{f.current&&clearInterval(f.current),t!=null&&t.startsWith("blob:")&&URL.revokeObjectURL(t),e(null),i(null),l(!1),d(0),m("")},L=S=>S<1024?`${S} B`:S<1024*1024?`${(S/1024).toFixed(1)} KB`:`${(S/(1024*1024)).toFixed(1)} MB`;return n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"content__header",children:[n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Resume"}),n.jsx("p",{className:"content__subtitle",children:"Upload and preview your resume PDF."})]}),s&&!o&&n.jsxs("button",{className:"btn btn--primary",onClick:()=>{var S;return(S=w.current)==null?void 0:S.click()},children:[n.jsx("span",{className:"material-icons",children:"upload_file"}),"Replace"]})]}),_&&n.jsxs("div",{className:"resume-error",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),_]}),n.jsx("input",{ref:w,type:"file",accept:".pdf,application/pdf",style:{display:"none"},onChange:A}),s?n.jsxs("div",{className:"card resume-card",children:[n.jsxs("div",{className:"resume-meta",children:[n.jsx("span",{className:"material-icons resume-meta__icon",children:"picture_as_pdf"}),n.jsxs("div",{className:"resume-meta__info",children:[n.jsx("span",{className:"resume-meta__name",children:s.name}),n.jsx("span",{className:"resume-meta__size",children:L(s.size)})]}),!o&&n.jsxs("div",{className:"resume-meta__actions",children:[n.jsx("button",{className:"btn btn--ghost btn--sm",onClick:()=>{var S;return(S=w.current)==null?void 0:S.click()},title:"Replace file",children:n.jsx("span",{className:"material-icons",children:"swap_horiz"})}),n.jsx("button",{className:"btn btn--ghost btn--sm resume-meta__delete",onClick:D,title:"Remove file",children:n.jsx("span",{className:"material-icons",children:"delete_outline"})})]})]}),o&&n.jsxs("div",{className:"resume-progress",children:[n.jsx("div",{className:"resume-progress__bar",children:n.jsx("div",{className:"resume-progress__fill",style:{width:`${c}%`}})}),n.jsxs("span",{className:"resume-progress__pct",children:[Math.round(c),"%"]})]}),t&&!o&&n.jsx("div",{className:"resume-preview",children:n.jsx("iframe",{src:t,className:"resume-preview__frame",title:"Resume preview"})})]}):n.jsxs("div",{className:`resume-dropzone${r?" resume-dropzone--active":""}`,onDrop:I,onDragOver:p,onDragEnter:x,onDragLeave:k,onClick:()=>{var S;return(S=w.current)==null?void 0:S.click()},role:"button",tabIndex:0,onKeyDown:S=>{var v;return S.key==="Enter"&&((v=w.current)==null?void 0:v.click())},children:[n.jsx("span",{className:"material-icons resume-dropzone__icon",children:r?"file_download":"upload_file"}),n.jsx("p",{className:"resume-dropzone__primary",children:r?"Drop to upload":"Drop your PDF here or click to browse"}),n.jsx("p",{className:"resume-dropzone__secondary",children:"PDF only · Max 10 MB"})]})]})}function Hl(){var o;const{user:s,signOut:e}=Z(),{isDark:t,toggleTheme:i}=Yt(),r=(s==null?void 0:s.displayName)||((o=s==null?void 0:s.email)==null?void 0:o.split("@")[0])||"User",a=(s==null?void 0:s.photoURL)||`https://ui-avatars.com/api/?name=${encodeURIComponent(r)}&background=6366f1&color=fff&size=64&bold=true`;return n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"content__header",children:n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Settings"}),n.jsx("p",{className:"content__subtitle",children:"Manage your account and preferences."})]})}),n.jsxs("div",{className:"card settings-card",children:[n.jsx("h2",{className:"settings-card__title",children:"Account"}),n.jsxs("div",{className:"settings-field settings-field--row settings-field--avatar",children:[n.jsxs("div",{children:[n.jsx("span",{className:"settings-label",children:"Profile Photo"}),n.jsx("span",{className:"settings-hint",children:"Synced from Google or generated automatically"})]}),n.jsx("img",{src:a,alt:r,className:"settings-avatar"})]}),n.jsxs("div",{className:"settings-field",children:[n.jsx("label",{className:"settings-label",htmlFor:"s-name",children:"Display Name"}),n.jsx("input",{id:"s-name",type:"text",className:"settings-input",defaultValue:r,placeholder:"Your name"})]}),n.jsxs("div",{className:"settings-field",children:[n.jsx("label",{className:"settings-label",htmlFor:"s-email",children:"Email"}),n.jsx("input",{id:"s-email",type:"email",className:"settings-input",defaultValue:(s==null?void 0:s.email)||"",placeholder:"your@email.com",disabled:!0}),n.jsx("span",{className:"settings-hint",children:"Email cannot be changed here."})]}),n.jsx("div",{className:"settings-card__footer",children:n.jsx("button",{className:"btn btn--primary btn--sm",children:"Save Changes"})})]}),n.jsxs("div",{className:"card settings-card",children:[n.jsx("h2",{className:"settings-card__title",children:"Appearance"}),n.jsxs("div",{className:"settings-field settings-field--row",children:[n.jsxs("div",{children:[n.jsx("span",{className:"settings-label",children:"Dark Mode"}),n.jsx("span",{className:"settings-hint",children:"Toggle between light and dark theme"})]}),n.jsx("button",{className:`settings-toggle${t?" settings-toggle--on":""}`,onClick:i,role:"switch","aria-checked":t,"aria-label":"Toggle dark mode",children:n.jsx("span",{className:"settings-toggle__thumb"})})]})]}),n.jsxs("div",{className:"card settings-card",children:[n.jsx("h2",{className:"settings-card__title",children:"Notifications"}),[{id:"n1",label:"New job matches",hint:"Notify me when jobs matching my profile are posted",defaultOn:!0},{id:"n2",label:"Application updates",hint:"Updates when my application status changes",defaultOn:!0},{id:"n3",label:"Interview reminders",hint:"Reminders 24 hours before scheduled interviews",defaultOn:!0},{id:"n4",label:"Weekly digest",hint:"Weekly summary of my job search activity",defaultOn:!1}].map(l=>n.jsxs("div",{className:"settings-field settings-field--row",children:[n.jsxs("div",{children:[n.jsx("span",{className:"settings-label",children:l.label}),n.jsx("span",{className:"settings-hint",children:l.hint})]}),n.jsxs("label",{className:"settings-checkbox-wrap",children:[n.jsx("input",{type:"checkbox",defaultChecked:l.defaultOn}),n.jsx("span",{className:"settings-checkbox__mark"})]})]},l.id))]}),n.jsxs("div",{className:"card settings-card settings-card--danger",children:[n.jsx("h2",{className:"settings-card__title settings-card__title--danger",children:"Danger Zone"}),n.jsxs("div",{className:"settings-field settings-field--row",children:[n.jsxs("div",{children:[n.jsx("span",{className:"settings-label",children:"Sign out"}),n.jsx("span",{className:"settings-hint",children:"Sign out of your account on this device"})]}),n.jsx("button",{className:"btn btn--ghost btn--sm",onClick:e,children:"Sign out"})]}),n.jsxs("div",{className:"settings-field settings-field--row",children:[n.jsxs("div",{children:[n.jsx("span",{className:"settings-label",children:"Delete Account"}),n.jsx("span",{className:"settings-hint",children:"Permanently delete your account and all data — this cannot be undone"})]}),n.jsx("button",{className:"btn btn--danger btn--sm",children:"Delete Account"})]})]})]})}function Wl(){return n.jsxs("div",{className:"content__placeholder",style:{minHeight:"60vh"},children:[n.jsx("span",{style:{fontSize:"4rem",fontWeight:800,color:"var(--color-primary)",opacity:.25},children:"404"}),n.jsx("h2",{children:"Page not found"}),n.jsx("p",{children:"The page you're looking for doesn't exist or has been moved."}),n.jsxs(tt,{to:"/",className:"btn btn--primary",style:{marginTop:8},children:[n.jsx("span",{className:"material-icons",children:"arrow_back"}),"Back to Dashboard"]})]})}const K={primary:"#6366f1",green:"#22c55e",amber:"#f59e0b",blue:"#3b82f6",red:"#ef4444"},zs=["#6366f1","#3b82f6","#8b5cf6","#06b6d4"];function zl(s=[]){const e={};return s.forEach(({_id:t,total:i,interviews:r})=>{e[t]={total:i,interviews:r}}),Array.from({length:30},(t,i)=>{var l,c;const r=new Date;r.setDate(r.getDate()-(29-i));const a=r.toISOString().slice(0,10),o=r.toLocaleDateString("en-US",{month:"short",day:"numeric"});return{date:a,label:o,applications:((l=e[a])==null?void 0:l.total)??0,interviews:((c=e[a])==null?void 0:c.interviews)??0}})}function Pt(s,e){return e===0?0:Math.round(s/e*100*10)/10}function ql(s){return s?new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—"}function Ot({active:s,payload:e,label:t,isDark:i}){if(!s||!(e!=null&&e.length))return null;const r=i?"#1e293b":"#ffffff",a=i?"#334155":"#e2e8f0";return n.jsxs("div",{style:{background:r,border:`1px solid ${a}`,borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,.15)",fontSize:"0.8rem"},children:[n.jsx("p",{style:{fontWeight:700,marginBottom:6,color:i?"#f1f5f9":"#1e293b"},children:t}),e.map(o=>n.jsxs("p",{style:{color:o.color,margin:"2px 0"},children:[o.name,": ",n.jsx("strong",{children:o.value})]},o.dataKey))]})}function qs({rate:s,color:e,label:t,sub:i,isDark:r}){const a=r?"#334155":"#e2e8f0",o=[{value:Math.max(0,Math.min(100,s))},{value:Math.max(0,100-s)}];return n.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:8},children:[n.jsxs("div",{style:{position:"relative",width:"100%",height:180},children:[n.jsx(st,{width:"100%",height:180,children:n.jsx(li,{children:n.jsxs(ci,{data:o,cx:"50%",cy:"50%",startAngle:90,endAngle:-270,innerRadius:"55%",outerRadius:"72%",paddingAngle:s>0&&s<100?3:0,dataKey:"value",strokeWidth:0,children:[n.jsx(ot,{fill:e}),n.jsx(ot,{fill:a})]})})}),n.jsx("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",textAlign:"center",pointerEvents:"none"},children:n.jsxs("div",{style:{fontSize:"1.6rem",fontWeight:800,color:r?"#f1f5f9":"#1e293b",lineHeight:1},children:[s.toFixed(1),"%"]})})]}),n.jsxs("div",{style:{textAlign:"center"},children:[n.jsx("div",{style:{fontWeight:700,fontSize:"0.85rem",color:r?"#f1f5f9":"#1e293b"},children:t}),i&&n.jsx("div",{style:{fontSize:"0.72rem",color:r?"#94a3b8":"#64748b",marginTop:2},children:i})]})]})}function Kl(){const{isDark:s}=Yt(),[e,t]=u.useState(null),[i,r]=u.useState(!0),[a,o]=u.useState("");if(u.useEffect(()=>{F.get("/admin/stats").then(({data:p})=>t(p)).catch(p=>o(p.message)).finally(()=>r(!1))},[]),i)return n.jsxs("div",{className:"admin-loading",children:[n.jsx("div",{className:"admin-loading__spinner"}),"Loading analytics…"]});if(a)return n.jsxs("div",{className:"admin-empty",children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),n.jsx("span",{className:"admin-empty__text",children:a})]});const l=e.applications.byStatus,c=e.applications.total||1,d=Pt(l.interview+l.offer,c),_=Pt(l.rejected,c),m=Pt(l.offer,c),w=zl(e.timeline??[]),b=[{name:"Pending",count:l.pending,fill:K.amber},{name:"Interview",count:l.interview,fill:K.blue},{name:"Offer",count:l.offer,fill:K.green},{name:"Rejected",count:l.rejected,fill:K.red}],f=Object.entries(e.jobsByType??{}).sort((p,x)=>x[1]-p[1]).map(([p,x],k)=>({name:p,count:x,fill:zs[k%zs.length]})),N=s?"#94a3b8":"#64748b",I=s?"#334155":"#e2e8f0";return n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"content__header",children:[n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Admin Overview"}),n.jsx("p",{className:"content__subtitle",children:"Platform health and activity at a glance"})]}),n.jsxs("div",{style:{display:"flex",gap:10},children:[n.jsxs(tt,{to:"/admin/users",className:"btn btn--ghost btn--sm",children:[n.jsx("span",{className:"material-icons",children:"people"})," Users"]}),n.jsxs(tt,{to:"/admin/jobs",className:"btn btn--primary btn--sm",children:[n.jsx("span",{className:"material-icons",children:"work"})," Manage Jobs"]})]})]}),n.jsxs("div",{className:"admin-stats",children:[n.jsxs("div",{className:"admin-stat",children:[n.jsx("div",{className:"admin-stat__icon admin-stat__icon--blue",children:n.jsx("span",{className:"material-icons",children:"people"})}),n.jsx("div",{className:"admin-stat__value",children:e.users.total}),n.jsx("div",{className:"admin-stat__label",children:"Total Users"}),n.jsxs("div",{className:"admin-stat__sub",children:[e.users.admins," admin",e.users.admins!==1?"s":""," · ",e.users.regular," regular"]})]}),n.jsxs("div",{className:"admin-stat",children:[n.jsx("div",{className:"admin-stat__icon admin-stat__icon--green",children:n.jsx("span",{className:"material-icons",children:"work"})}),n.jsx("div",{className:"admin-stat__value",children:e.jobs.active}),n.jsx("div",{className:"admin-stat__label",children:"Active Jobs"}),n.jsxs("div",{className:"admin-stat__sub",children:[e.jobs.inactive," inactive · ",e.jobs.total," total"]})]}),n.jsxs("div",{className:"admin-stat",children:[n.jsx("div",{className:"admin-stat__icon admin-stat__icon--purple",children:n.jsx("span",{className:"material-icons",children:"assignment"})}),n.jsx("div",{className:"admin-stat__value",children:e.applications.total}),n.jsx("div",{className:"admin-stat__label",children:"Applications"}),n.jsxs("div",{className:"admin-stat__sub",children:[l.offer," offer",l.offer!==1?"s":""," · ",l.interview," interview",l.interview!==1?"s":""]})]}),n.jsxs("div",{className:"admin-stat",children:[n.jsx("div",{className:"admin-stat__icon admin-stat__icon--amber",children:n.jsx("span",{className:"material-icons",children:"trending_up"})}),n.jsxs("div",{className:"admin-stat__value",children:[m,"%"]}),n.jsx("div",{className:"admin-stat__label",children:"Offer Rate"}),n.jsxs("div",{className:"admin-stat__sub",children:[l.offer," offer",l.offer!==1?"s":""," from ",c-1," applications"]})]})]}),n.jsxs("div",{className:"admin-panel",children:[n.jsxs("div",{className:"admin-panel__header",children:[n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"show_chart"}),"Applications Over Time",n.jsx("span",{style:{fontSize:"0.72rem",fontWeight:500,color:N,marginLeft:4},children:"last 30 days"})]}),n.jsxs("div",{style:{display:"flex",gap:16,fontSize:"0.78rem"},children:[n.jsxs("span",{style:{display:"flex",alignItems:"center",gap:5},children:[n.jsx("span",{style:{width:10,height:10,borderRadius:2,background:K.primary,display:"inline-block"}}),"Applications"]}),n.jsxs("span",{style:{display:"flex",alignItems:"center",gap:5},children:[n.jsx("span",{style:{width:10,height:10,borderRadius:2,background:K.green,display:"inline-block"}}),"Reached Interview"]})]})]}),n.jsx("div",{style:{padding:"8px 20px 20px"},children:n.jsx(st,{width:"100%",height:220,children:n.jsxs(oi,{data:w,margin:{top:4,right:4,bottom:0,left:-16},children:[n.jsxs("defs",{children:[n.jsxs("linearGradient",{id:"gradApp",x1:"0",y1:"0",x2:"0",y2:"1",children:[n.jsx("stop",{offset:"5%",stopColor:K.primary,stopOpacity:.25}),n.jsx("stop",{offset:"95%",stopColor:K.primary,stopOpacity:0})]}),n.jsxs("linearGradient",{id:"gradInt",x1:"0",y1:"0",x2:"0",y2:"1",children:[n.jsx("stop",{offset:"5%",stopColor:K.green,stopOpacity:.25}),n.jsx("stop",{offset:"95%",stopColor:K.green,stopOpacity:0})]})]}),n.jsx(bt,{strokeDasharray:"3 3",stroke:I,vertical:!1}),n.jsx(yt,{dataKey:"label",tick:{fontSize:11,fill:N},tickLine:!1,axisLine:!1,interval:4}),n.jsx(xt,{tick:{fontSize:11,fill:N},tickLine:!1,axisLine:!1,allowDecimals:!1}),n.jsx(Nt,{content:n.jsx(Ot,{isDark:s}),cursor:{stroke:I,strokeWidth:1}}),n.jsx(ds,{type:"monotone",dataKey:"applications",name:"Applications",stroke:K.primary,strokeWidth:2,fill:"url(#gradApp)",dot:!1,activeDot:{r:4,strokeWidth:0}}),n.jsx(ds,{type:"monotone",dataKey:"interviews",name:"Reached Interview",stroke:K.green,strokeWidth:2,fill:"url(#gradInt)",dot:!1,activeDot:{r:4,strokeWidth:0}})]})})})]}),n.jsxs("div",{className:"admin-chart-row",children:[n.jsxs("div",{className:"admin-panel admin-chart-row__main",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"filter_list"}),"Application Pipeline"]})}),n.jsx("div",{style:{padding:"8px 20px 20px"},children:n.jsx(st,{width:"100%",height:200,children:n.jsxs(us,{data:b,margin:{top:4,right:4,bottom:0,left:-16},barCategoryGap:"30%",children:[n.jsx(bt,{strokeDasharray:"3 3",stroke:I,horizontal:!0,vertical:!1}),n.jsx(yt,{dataKey:"name",tick:{fontSize:11,fill:N},tickLine:!1,axisLine:!1}),n.jsx(xt,{tick:{fontSize:11,fill:N},tickLine:!1,axisLine:!1,allowDecimals:!1}),n.jsx(Nt,{content:n.jsx(Ot,{isDark:s}),cursor:{fill:s?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)"}}),n.jsx(hs,{dataKey:"count",name:"Applications",radius:[5,5,0,0],children:b.map((p,x)=>n.jsx(ot,{fill:p.fill},x))})]})})})]}),n.jsxs("div",{className:"admin-panel admin-chart-row__donut",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"record_voice_over"}),"Interview Rate"]})}),n.jsx("div",{style:{padding:"8px 20px 20px"},children:n.jsx(qs,{rate:d,color:K.blue,label:"Reached Interview",sub:`${l.interview+l.offer} of ${c-1} applicants`,isDark:s})})]}),n.jsxs("div",{className:"admin-panel admin-chart-row__donut",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"do_not_disturb"}),"Rejection Rate"]})}),n.jsx("div",{style:{padding:"8px 20px 20px"},children:n.jsx(qs,{rate:_,color:K.red,label:"Rejected",sub:`${l.rejected} of ${c-1} applicants`,isDark:s})})]})]}),n.jsxs("div",{className:"admin-analytics",children:[n.jsxs("div",{className:"admin-panel",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"pie_chart"}),"Jobs by Type"]})}),n.jsx("div",{style:{padding:"8px 20px 20px"},children:f.length===0?n.jsxs("div",{className:"admin-empty",style:{padding:"24px 0"},children:[n.jsx("span",{className:"material-icons",children:"work_off"}),n.jsx("span",{className:"admin-empty__text",children:"No job data yet"})]}):n.jsx(st,{width:"100%",height:200,children:n.jsxs(us,{data:f,layout:"vertical",margin:{top:0,right:24,bottom:0,left:8},barCategoryGap:"25%",children:[n.jsx(bt,{strokeDasharray:"3 3",stroke:I,horizontal:!1}),n.jsx(yt,{type:"number",tick:{fontSize:11,fill:N},tickLine:!1,axisLine:!1,allowDecimals:!1}),n.jsx(xt,{type:"category",dataKey:"name",tick:{fontSize:11,fill:N},tickLine:!1,axisLine:!1,width:70}),n.jsx(Nt,{content:n.jsx(Ot,{isDark:s}),cursor:{fill:s?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)"}}),n.jsx(hs,{dataKey:"count",name:"Active jobs",radius:[0,5,5,0],children:f.map((p,x)=>n.jsx(ot,{fill:p.fill},x))})]})})})]}),n.jsxs("div",{className:"admin-panel",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"assignment_turned_in"}),"Recent Applications"]})}),n.jsx("div",{className:"admin-panel__body",style:{padding:"0 20px"},children:e.recentApps.length===0?n.jsxs("div",{className:"admin-empty",style:{padding:"24px 0"},children:[n.jsx("span",{className:"material-icons",children:"assignment_late"}),n.jsx("span",{className:"admin-empty__text",children:"No applications yet"})]}):n.jsx("div",{className:"recent-list",children:e.recentApps.map(p=>n.jsxs("div",{className:"recent-list__item",children:[n.jsx("div",{className:"recent-list__left",children:n.jsxs("div",{children:[n.jsx("div",{className:"recent-list__name",children:p.role}),n.jsxs("div",{className:"recent-list__sub",children:[p.company," · ",ql(p.appliedAt)]})]})}),n.jsx("div",{className:"recent-list__right",children:n.jsx("span",{className:`status-badge status-badge--${p.status}`,children:p.status})})]},p._id))})})]})]}),n.jsxs("div",{className:"admin-panel",children:[n.jsxs("div",{className:"admin-panel__header",children:[n.jsxs("div",{className:"admin-panel__title",children:[n.jsx("span",{className:"material-icons",children:"person_add"}),"Recent Sign-ups"]}),n.jsx(tt,{to:"/admin/users",className:"btn btn--ghost btn--sm",children:"View all"})]}),n.jsx("div",{className:"admin-panel__body",style:{padding:"0 20px"},children:e.recentUsers.length===0?n.jsxs("div",{className:"admin-empty",style:{padding:"24px 0"},children:[n.jsx("span",{className:"material-icons",children:"people_outline"}),n.jsx("span",{className:"admin-empty__text",children:"No users yet"})]}):n.jsx("div",{className:"recent-list",children:e.recentUsers.map(p=>{var A;const x=p.name||((A=p.email)==null?void 0:A.split("@")[0])||"User",k=p.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(x)}&background=6366f1&color=fff&size=30&bold=true`;return n.jsxs("div",{className:"recent-list__item",children:[n.jsxs("div",{className:"recent-list__left",children:[n.jsx("img",{src:k,alt:x,className:"recent-list__avatar"}),n.jsxs("div",{children:[n.jsx("div",{className:"recent-list__name",children:x}),n.jsx("div",{className:"recent-list__sub",children:p.email})]})]}),n.jsx("div",{className:"recent-list__right",children:n.jsxs("span",{className:`role-badge role-badge--${p.role}`,children:[n.jsx("span",{className:"material-icons",children:p.role==="admin"?"shield":"person"}),p.role]})})]},p._id)})})})]})]})}const Ze=20;function Gl(s){return s?new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—"}function Jl(s){var t;const e=s.name||((t=s.email)==null?void 0:t.split("@")[0])||"U";return s.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(e)}&background=6366f1&color=fff&size=32&bold=true`}function Yl(){const{user:s}=Z(),[e,t]=u.useState([]),[i,r]=u.useState(0),[a,o]=u.useState(1),[l,c]=u.useState(!0),[d,_]=u.useState(""),[m,w]=u.useState(""),[b,f]=u.useState(null),[N,I]=u.useState(!1),[p,x]=u.useState(null),k=u.useRef(null),A=u.useCallback((g,T,C)=>{c(!0);const R=new URLSearchParams({page:g,limit:Ze});T&&R.set("search",T),C&&R.set("role",C),F.get(`/admin/users?${R}`).then(({data:M,pagination:B})=>{t(M),r(B.total)}).catch(console.error).finally(()=>c(!1))},[]);u.useEffect(()=>{A(a,d,m)},[A,a,m]);function D(g){const T=g.target.value;_(T),o(1),clearTimeout(k.current),k.current=setTimeout(()=>A(1,T,m),350)}function L(g){w(g.target.value),o(1)}async function S(g){const T=g.role==="admin"?"user":"admin";x(g._id);try{const{data:C}=await F.put?await F.put(`/admin/users/${g._id}`,{role:T}):{data:null}}catch{}try{const C=localStorage.getItem("jdToken");(await(await fetch(`/api/admin/users/${g._id}`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${C}`},body:JSON.stringify({role:T})})).json()).success&&t(B=>B.map(y=>y._id===g._id?{...y,role:T}:y))}catch(C){console.error(C)}finally{x(null)}}async function v(){if(b){I(!0);try{await F.delete(`/admin/users/${b._id}`),t(g=>g.filter(T=>T._id!==b._id)),r(g=>g-1),f(null)}catch(g){alert(g.message)}finally{I(!1)}}}const j=Math.ceil(i/Ze);return n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"content__header",children:n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"User Management"}),n.jsxs("p",{className:"content__subtitle",children:[i," registered user",i!==1?"s":""]})]})}),n.jsxs("div",{className:"admin-panel",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-toolbar",children:[n.jsxs("div",{className:"admin-toolbar__search",children:[n.jsx("span",{className:"material-icons",children:"search"}),n.jsx("input",{type:"text",placeholder:"Search by name or email…",value:d,onChange:D})]}),n.jsxs("select",{className:"admin-toolbar__select",value:m,onChange:L,children:[n.jsx("option",{value:"",children:"All roles"}),n.jsx("option",{value:"user",children:"User"}),n.jsx("option",{value:"admin",children:"Admin"})]})]})}),n.jsx("div",{className:"admin-table-wrap",children:n.jsxs("table",{className:"admin-table",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{children:"User"}),n.jsx("th",{children:"Role"}),n.jsx("th",{children:"Joined"}),n.jsx("th",{children:"Actions"})]})}),n.jsx("tbody",{children:l?Array.from({length:5}).map((g,T)=>n.jsxs("tr",{className:"admin-skeleton-row",children:[n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:"60%"}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:60}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:80}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:70}})})]},T)):e.length===0?n.jsx("tr",{children:n.jsx("td",{colSpan:4,children:n.jsxs("div",{className:"admin-empty",children:[n.jsx("span",{className:"material-icons",children:"person_off"}),n.jsx("span",{className:"admin-empty__text",children:"No users found"})]})})}):e.map(g=>n.jsxs("tr",{children:[n.jsx("td",{children:n.jsxs("div",{className:"user-cell",children:[n.jsx("img",{src:Jl(g),alt:g.name,className:"user-cell__avatar"}),n.jsxs("div",{children:[n.jsxs("div",{className:"user-cell__name",children:[g.name||"—",g._id===(s==null?void 0:s._id)&&n.jsx("span",{style:{marginLeft:6,fontSize:"0.7rem",color:"var(--color-text-muted)"},children:"(you)"})]}),n.jsx("div",{className:"user-cell__email",children:g.email})]})]})}),n.jsx("td",{children:n.jsxs("span",{className:`role-badge role-badge--${g.role}`,children:[n.jsx("span",{className:"material-icons",children:g.role==="admin"?"shield":"person"}),g.role]})}),n.jsx("td",{style:{color:"var(--color-text-muted)",fontSize:"0.82rem"},children:Gl(g.createdAt)}),n.jsx("td",{children:n.jsx("div",{className:"admin-actions",children:g._id!==(s==null?void 0:s._id)&&n.jsxs(n.Fragment,{children:[n.jsx("button",{className:"admin-action-btn",title:g.role==="admin"?"Revoke admin":"Make admin",onClick:()=>S(g),disabled:p===g._id,children:n.jsx("span",{className:"material-icons",children:p===g._id?"hourglass_empty":g.role==="admin"?"person_remove":"manage_accounts"})}),n.jsx("button",{className:"admin-action-btn admin-action-btn--danger",title:"Delete user",onClick:()=>f(g),children:n.jsx("span",{className:"material-icons",children:"delete_outline"})})]})})})]},g._id))})]})}),j>1&&n.jsxs("div",{className:"admin-pagination",children:[n.jsxs("span",{className:"admin-pagination__info",children:["Showing ",(a-1)*Ze+1,"–",Math.min(a*Ze,i)," of ",i]}),n.jsxs("div",{className:"admin-pagination__btns",children:[n.jsx("button",{className:"admin-pagination__btn",disabled:a===1,onClick:()=>o(g=>g-1),children:"← Prev"}),n.jsx("button",{className:"admin-pagination__btn",disabled:a>=j,onClick:()=>o(g=>g+1),children:"Next →"})]})]})]}),b&&n.jsx("div",{className:"confirm-overlay",onClick:()=>f(null),children:n.jsxs("div",{className:"confirm-box",onClick:g=>g.stopPropagation(),children:[n.jsx("div",{className:"confirm-box__icon",children:n.jsx("span",{className:"material-icons",children:"warning"})}),n.jsxs("div",{children:[n.jsx("div",{className:"confirm-box__title",children:"Delete user?"}),n.jsxs("div",{className:"confirm-box__desc",children:[n.jsx("strong",{children:b.name||b.email})," and all their applications will be permanently deleted. This cannot be undone."]})]}),n.jsxs("div",{className:"confirm-box__actions",children:[n.jsx("button",{className:"btn btn--ghost btn--sm",onClick:()=>f(null),children:"Cancel"}),n.jsx("button",{className:"btn btn--sm",style:{background:"var(--color-red)",color:"#fff"},onClick:v,disabled:N,children:N?"Deleting…":"Delete"})]})]})})]})}const et=20,Ks=["full-time","part-time","contract","internship"],Gs={title:"",company:"",location:"",type:"full-time",url:"",companyLogo:"",salary:"",salaryMin:"",salaryMax:"",department:"",description:"",requirements:"",isActive:!0};function Xl(s){return s?new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—"}function Ql(){const[s,e]=u.useState([]),[t,i]=u.useState(0),[r,a]=u.useState(1),[o,l]=u.useState(!0),[c,d]=u.useState(""),[_,m]=u.useState(""),[w,b]=u.useState(""),[f,N]=u.useState(null),[I,p]=u.useState(!1),[x,k]=u.useState(null),[A,D]=u.useState(!1),[L,S]=u.useState(null),[v,j]=u.useState(Gs),[g,T]=u.useState({}),[C,R]=u.useState(!1),M=u.useRef(null),B=u.useCallback((h,$,V,H)=>{l(!0);const J=new URLSearchParams({page:h,limit:et});$&&J.set("search",$),V&&J.set("type",V),H&&J.set("active",H),F.get(`/admin/jobs?${J}`).then(({data:Ie,pagination:si})=>{e(Ie),i(si.total)}).catch(console.error).finally(()=>l(!1))},[]);u.useEffect(()=>{B(r,c,_,w)},[B,r,_,w]);function y(h){const $=h.target.value;d($),a(1),clearTimeout(M.current),M.current=setTimeout(()=>B(1,$,_,w),350)}function U(){S(null),j(Gs),T({}),D(!0)}function W(h){S(h),j({title:h.title??"",company:h.company??"",location:h.location??"",type:h.type??"full-time",url:h.url??"",companyLogo:h.companyLogo??"",salary:h.salary??"",salaryMin:h.salaryMin!=null?String(h.salaryMin):"",salaryMax:h.salaryMax!=null?String(h.salaryMax):"",department:h.department??"",description:h.description??"",requirements:Array.isArray(h.requirements)?h.requirements.join(`
`):"",isActive:h.isActive??!0}),T({}),D(!0)}function O(h,$){j(V=>({...V,[h]:$})),T(V=>{const H={...V};return delete H[h],H})}function Le(){const h={};return v.title.trim()||(h.title="Required"),v.company.trim()||(h.company="Required"),v.location.trim()||(h.location="Required"),v.url.trim()?/^https?:\/\/.+/.test(v.url.trim())||(h.url="Must start with http:// or https://"):h.url="Required",v.salaryMin&&isNaN(Number(v.salaryMin))&&(h.salaryMin="Must be a number"),v.salaryMax&&isNaN(Number(v.salaryMax))&&(h.salaryMax="Must be a number"),T(h),Object.keys(h).length===0}async function Zn(){var $;if(!Le())return;R(!0);const h={title:v.title.trim(),company:v.company.trim(),location:v.location.trim(),type:v.type,url:v.url.trim(),companyLogo:v.companyLogo.trim()||void 0,salary:v.salary.trim()||void 0,salaryMin:v.salaryMin!==""?Number(v.salaryMin):void 0,salaryMax:v.salaryMax!==""?Number(v.salaryMax):void 0,department:v.department.trim()||void 0,description:v.description.trim()||void 0,requirements:v.requirements.trim()?v.requirements.split(`
`).map(V=>V.trim()).filter(Boolean):void 0,isActive:v.isActive};try{if(L){const{data:V}=await F.put(`/jobs/${L._id}`,h);e(H=>H.map(J=>J._id===L._id?V:J))}else{const{data:V}=await F.post("/jobs",h);e(H=>[V,...H]),i(H=>H+1)}D(!1)}catch(V){if(($=V.errors)!=null&&$.length){const H={};V.errors.forEach(({path:J,msg:Ie})=>{H[J]=Ie}),T(H)}else T({_global:V.message})}finally{R(!1)}}async function ei(h){k(h._id);try{const $=localStorage.getItem("jdToken"),H=await(await fetch(`/api/admin/jobs/${h._id}/toggle`,{method:"PATCH",headers:{Authorization:`Bearer ${$}`}})).json();H.success&&e(J=>J.map(Ie=>Ie._id===h._id?H.data:Ie))}catch($){console.error($)}finally{k(null)}}async function ti(){if(f){p(!0);try{await F.delete(`/jobs/${f._id}`),e(h=>h.map($=>$._id===f._id?{...$,isActive:!1}:$)),N(null)}catch(h){alert(h.message)}finally{p(!1)}}}const ls=Math.ceil(t/et);return n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"content__header",children:[n.jsxs("div",{children:[n.jsx("h1",{className:"content__title",children:"Job Management"}),n.jsxs("p",{className:"content__subtitle",children:[t," job listing",t!==1?"s":""," total"]})]}),n.jsxs("button",{className:"btn btn--primary",onClick:U,children:[n.jsx("span",{className:"material-icons",children:"add"})," New Job"]})]}),n.jsxs("div",{className:"admin-panel",children:[n.jsx("div",{className:"admin-panel__header",children:n.jsxs("div",{className:"admin-toolbar",children:[n.jsxs("div",{className:"admin-toolbar__search",children:[n.jsx("span",{className:"material-icons",children:"search"}),n.jsx("input",{type:"text",placeholder:"Search jobs…",value:c,onChange:y})]}),n.jsxs("select",{className:"admin-toolbar__select",value:_,onChange:h=>{m(h.target.value),a(1)},children:[n.jsx("option",{value:"",children:"All types"}),Ks.map(h=>n.jsx("option",{value:h,children:h},h))]}),n.jsxs("select",{className:"admin-toolbar__select",value:w,onChange:h=>{b(h.target.value),a(1)},children:[n.jsx("option",{value:"",children:"All status"}),n.jsx("option",{value:"true",children:"Active"}),n.jsx("option",{value:"false",children:"Inactive"})]})]})}),n.jsx("div",{className:"admin-table-wrap",children:n.jsxs("table",{className:"admin-table",children:[n.jsx("thead",{children:n.jsxs("tr",{children:[n.jsx("th",{children:"Job"}),n.jsx("th",{children:"Type"}),n.jsx("th",{children:"Salary"}),n.jsx("th",{children:"Status"}),n.jsx("th",{children:"Posted"}),n.jsx("th",{children:"Actions"})]})}),n.jsx("tbody",{children:o?Array.from({length:5}).map((h,$)=>n.jsxs("tr",{className:"admin-skeleton-row",children:[n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:"65%"}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:70}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:80}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:60}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:80}})}),n.jsx("td",{children:n.jsx("div",{className:"shimmer admin-skeleton-cell",style:{width:70}})})]},$)):s.length===0?n.jsx("tr",{children:n.jsx("td",{colSpan:6,children:n.jsxs("div",{className:"admin-empty",children:[n.jsx("span",{className:"material-icons",children:"work_off"}),n.jsx("span",{className:"admin-empty__text",children:"No jobs found"})]})})}):s.map(h=>n.jsxs("tr",{children:[n.jsxs("td",{children:[n.jsx("div",{style:{fontWeight:600,color:"var(--color-text)"},children:h.title}),n.jsxs("div",{style:{fontSize:"0.78rem",color:"var(--color-text-muted)"},children:[h.company," · ",h.location]})]}),n.jsx("td",{children:n.jsx("span",{className:`type-badge type-badge--${h.type==="full-time"?"full":h.type==="contract"||h.type==="part-time"?"hybrid":"remote"}`,children:h.type})}),n.jsx("td",{style:{color:"var(--color-text-muted)",fontSize:"0.82rem"},children:h.salary||(h.salaryMin?`$${(h.salaryMin/1e3).toFixed(0)}k+`:"—")}),n.jsx("td",{children:n.jsxs("span",{className:`active-badge active-badge--${h.isActive?"on":"off"}`,children:[n.jsx("span",{className:"material-icons",style:{fontSize:12},children:h.isActive?"check_circle":"cancel"}),h.isActive?"Active":"Inactive"]})}),n.jsx("td",{style:{color:"var(--color-text-muted)",fontSize:"0.82rem"},children:Xl(h.postedAt)}),n.jsx("td",{children:n.jsxs("div",{className:"admin-actions",children:[n.jsx("button",{className:"admin-action-btn",title:"Edit",onClick:()=>W(h),children:n.jsx("span",{className:"material-icons",children:"edit"})}),n.jsx("button",{className:`admin-action-btn ${h.isActive?"admin-action-btn--danger":"admin-action-btn--success"}`,title:h.isActive?"Deactivate":"Restore",onClick:()=>ei(h),disabled:x===h._id,children:n.jsx("span",{className:"material-icons",children:x===h._id?"hourglass_empty":h.isActive?"visibility_off":"restore"})}),n.jsx("button",{className:"admin-action-btn admin-action-btn--danger",title:"Delete",onClick:()=>N(h),children:n.jsx("span",{className:"material-icons",children:"delete_outline"})})]})})]},h._id))})]})}),ls>1&&n.jsxs("div",{className:"admin-pagination",children:[n.jsxs("span",{className:"admin-pagination__info",children:["Showing ",(r-1)*et+1,"–",Math.min(r*et,t)," of ",t]}),n.jsxs("div",{className:"admin-pagination__btns",children:[n.jsx("button",{className:"admin-pagination__btn",disabled:r===1,onClick:()=>a(h=>h-1),children:"← Prev"}),n.jsx("button",{className:"admin-pagination__btn",disabled:r>=ls,onClick:()=>a(h=>h+1),children:"Next →"})]})]})]}),A&&n.jsx("div",{className:"modal-overlay",onClick:()=>D(!1),children:n.jsxs("div",{className:"modal",onClick:h=>h.stopPropagation(),children:[n.jsxs("div",{className:"modal__header",children:[n.jsx("div",{className:"modal__title",children:L?"Edit Job":"New Job Listing"}),n.jsx("button",{className:"modal__close",onClick:()=>D(!1),children:n.jsx("span",{className:"material-icons",children:"close"})})]}),n.jsxs("div",{className:"modal__body",children:[g._global&&n.jsxs("div",{className:"login-error",style:{marginBottom:8},children:[n.jsx("span",{className:"material-icons",children:"error_outline"}),g._global]}),n.jsxs("div",{className:"modal__row",children:[n.jsx(G,{label:"Job Title",req:!0,err:g.title,children:n.jsx("input",{className:"form-field__input",value:v.title,onChange:h=>O("title",h.target.value),placeholder:"Software Engineer"})}),n.jsx(G,{label:"Company",req:!0,err:g.company,children:n.jsx("input",{className:"form-field__input",value:v.company,onChange:h=>O("company",h.target.value),placeholder:"Acme Corp"})})]}),n.jsxs("div",{className:"modal__row",children:[n.jsx(G,{label:"Location",req:!0,err:g.location,children:n.jsx("input",{className:"form-field__input",value:v.location,onChange:h=>O("location",h.target.value),placeholder:"Remote / New York, NY"})}),n.jsx(G,{label:"Type",req:!0,err:g.type,children:n.jsx("select",{className:"form-field__select",value:v.type,onChange:h=>O("type",h.target.value),children:Ks.map(h=>n.jsx("option",{value:h,children:h},h))})})]}),n.jsx(G,{label:"Application URL",req:!0,err:g.url,full:!0,children:n.jsx("input",{className:"form-field__input",value:v.url,onChange:h=>O("url",h.target.value),placeholder:"https://jobs.example.com/apply/123"})}),n.jsxs("div",{className:"modal__row",children:[n.jsx(G,{label:"Company Logo URL",err:g.companyLogo,children:n.jsx("input",{className:"form-field__input",value:v.companyLogo,onChange:h=>O("companyLogo",h.target.value),placeholder:"https://..."})}),n.jsx(G,{label:"Department",err:g.department,children:n.jsx("input",{className:"form-field__input",value:v.department,onChange:h=>O("department",h.target.value),placeholder:"Engineering"})})]}),n.jsxs("div",{className:"modal__row",children:[n.jsx(G,{label:"Salary (display)",err:g.salary,children:n.jsx("input",{className:"form-field__input",value:v.salary,onChange:h=>O("salary",h.target.value),placeholder:"$120k – $160k"})}),n.jsxs("div",{className:"modal__row",style:{gap:8,margin:0},children:[n.jsx(G,{label:"Min ($)",err:g.salaryMin,children:n.jsx("input",{className:"form-field__input",type:"number",min:"0",value:v.salaryMin,onChange:h=>O("salaryMin",h.target.value),placeholder:"120000"})}),n.jsx(G,{label:"Max ($)",err:g.salaryMax,children:n.jsx("input",{className:"form-field__input",type:"number",min:"0",value:v.salaryMax,onChange:h=>O("salaryMax",h.target.value),placeholder:"160000"})})]})]}),n.jsx(G,{label:"Description",err:g.description,full:!0,children:n.jsx("textarea",{className:"form-field__textarea",value:v.description,onChange:h=>O("description",h.target.value),placeholder:"Describe the role…",rows:4})}),n.jsx(G,{label:"Requirements (one per line)",err:g.requirements,full:!0,children:n.jsx("textarea",{className:"form-field__textarea",value:v.requirements,onChange:h=>O("requirements",h.target.value),placeholder:`5+ years React
TypeScript proficiency
Strong communication skills`,rows:4})}),n.jsx("div",{children:n.jsxs("label",{className:"form-toggle",onClick:()=>O("isActive",!v.isActive),children:[n.jsx("div",{className:`form-toggle__switch ${v.isActive?"form-toggle__switch--on":""}`}),n.jsx("span",{className:"form-toggle__label",children:v.isActive?"Active — visible to job seekers":"Inactive — hidden from listings"})]})})]}),n.jsxs("div",{className:"modal__footer",children:[n.jsx("button",{className:"btn btn--ghost btn--sm",onClick:()=>D(!1),children:"Cancel"}),n.jsx("button",{className:"btn btn--primary btn--sm",onClick:Zn,disabled:C,children:C?"Saving…":L?"Save Changes":"Create Job"})]})]})}),f&&n.jsx("div",{className:"confirm-overlay",onClick:()=>N(null),children:n.jsxs("div",{className:"confirm-box",onClick:h=>h.stopPropagation(),children:[n.jsx("div",{className:"confirm-box__icon",children:n.jsx("span",{className:"material-icons",children:"warning"})}),n.jsxs("div",{children:[n.jsx("div",{className:"confirm-box__title",children:"Deactivate job?"}),n.jsxs("div",{className:"confirm-box__desc",children:[n.jsx("strong",{children:f.title})," at ",n.jsx("strong",{children:f.company})," will be hidden from job seekers. You can restore it later."]})]}),n.jsxs("div",{className:"confirm-box__actions",children:[n.jsx("button",{className:"btn btn--ghost btn--sm",onClick:()=>N(null),children:"Cancel"}),n.jsx("button",{className:"btn btn--sm",style:{background:"var(--color-red)",color:"#fff"},onClick:ti,disabled:I,children:I?"Deactivating…":"Deactivate"})]})]})})]})}function G({label:s,req:e,err:t,full:i,children:r}){return n.jsxs("div",{className:`form-field${i?" form-field--full":""}`,children:[n.jsx("label",{className:`form-field__label${e?" form-field__label--req":""}`,children:s}),r,t&&n.jsx("span",{className:"form-field__error",children:t})]})}function Zl(){const{loading:s}=Z();return s?n.jsx("div",{className:"auth-loading-overlay",children:n.jsx("div",{className:"auth-loading-spinner"})}):n.jsxs(ri,{children:[n.jsx(z,{path:"/login",element:n.jsx(Cl,{})}),n.jsx(z,{path:"/reset-password",element:n.jsx(Tl,{})}),n.jsx(z,{element:n.jsx(ml,{}),children:n.jsxs(z,{path:"/",element:n.jsx(kl,{}),children:[n.jsx(z,{index:!0,element:n.jsx(Ml,{})}),n.jsx(z,{path:"jobs",element:n.jsx(Ul,{})}),n.jsx(z,{path:"applications",element:n.jsx($l,{})}),n.jsx(z,{path:"resume",element:n.jsx(Vl,{})}),n.jsx(z,{path:"settings",element:n.jsx(Hl,{})}),n.jsxs(z,{element:n.jsx(pl,{}),children:[n.jsx(z,{path:"admin",element:n.jsx(Kl,{})}),n.jsx(z,{path:"admin/users",element:n.jsx(Yl,{})}),n.jsx(z,{path:"admin/jobs",element:n.jsx(Ql,{})})]}),n.jsx(z,{path:"*",element:n.jsx(Wl,{})})]})}),n.jsx(z,{path:"*",element:n.jsx(Kt,{to:"/",replace:!0})})]})}Zs(document.getElementById("root")).render(n.jsx(u.StrictMode,{children:n.jsx(ai,{children:n.jsx(gi,{children:n.jsx(hl,{children:n.jsx(Zl,{})})})})}));
