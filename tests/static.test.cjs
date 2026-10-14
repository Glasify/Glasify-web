const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const redirect = fs.readFileSync('assets/redirect.js', 'utf8');
async function route(country, options = {}) {
  let destination;
  let calls = 0;
  const location = { pathname: options.path || '/', hash: '#faq', replace: value => destination = value };
  await vm.runInNewContext(redirect, {
    location, AbortController, Map,
    setTimeout: options.timeout ? callback => { queueMicrotask(callback); return 1; } : setTimeout,
    clearTimeout,
    fetch: async (url, config) => {
      calls++;
      assert.equal(url, 'https://get.geojs.io/v1/ip/country');
      assert.equal(config.credentials, 'omit');
      assert.equal(config.referrerPolicy, 'no-referrer');
      if (options.fail) throw Error('offline');
      if (options.timeout) return new Promise(() => {});
      return { ok: !options.httpError, text: async () => country };
    }
  });
  return { destination, calls };
}
test('country mapping, including Finland and malformed output', async () => {
  for (const [country, expected] of [['NO','no'],['SE','se'],['DK','dk'],['FI','en'],['US','en'],['','en'],['__proto__','en'],['Norway','en'],[' NO\n','no']]) {
    assert.equal((await route(country)).destination, `/${expected}/#faq`);
  }
});
test('English fallback for network, HTTP and timeout failures', async () => {
  for (const option of [{fail:true},{httpError:true},{timeout:true}]) assert.equal((await route('NO',option)).destination,'/en/#faq');
});
test('explicit locales and unknown paths never trigger lookup', async () => {
  for (const path of ['/no/','/se','/dk/','/en/','/unknown','/fi/']) assert.deepEqual(await route('NO',{path}),{destination:undefined,calls:0});
});
test('static pages have correct language, switcher, translated messages and working form contract', () => {
  for (const [route, lang] of [['no','nb'],['se','sv'],['dk','da'],['en','en']]) {
    const html = fs.readFileSync(`${route}/index.html`,'utf8');
    assert.ok(html.includes(`<html lang="${lang}"`));
    for (const r of ['no','se','dk','en']) assert.ok(html.includes(`href="/${r}/"`));
    assert.equal((html.match(/<details>/g)||[]).length,8);
    for (const value of ['ios','android']) assert.ok(html.includes(`value="${value}"`));
    assert.ok(html.includes('data-messages='));
    assert.ok(html.includes('https://reportaproblem.apple.com/'));
    assert.ok(html.includes('/118428'));
    assert.ok(html.includes('mailto:contact@glasify.app'));
    assert.ok(!html.includes('redirect.js'));
    assert.ok(!/affiliate|navigator.language|geolocation/.test(html));
  }
  const missing = fs.readFileSync('404.html','utf8');
  assert.ok(!/waitlist|redirect.js|affiliate/.test(missing));
});
for (const platform of ['ios','android']) {
  for (const outcome of ['success','http','network']) {
    test(`waitlist ${platform}: ${outcome}`, async () => {
      let submitted;
      const message = { classList: { remove(){}, toggle(){}, add(){} } };
      const email = { value:' person@example.com ' };
      const button = { disabled:true };
      let handler;
      const form = {
        dataset:{messages:JSON.stringify({pending:'pending',success:'success',error:'error',network:'network'})},
        querySelector: selector => selector === 'button' ? button : {value:platform},
        reportValidity:()=>true, addEventListener:(_,callback)=>handler=callback
      };
      vm.runInNewContext(fs.readFileSync('assets/waitlist.js','utf8'), {
        document:{ getElementById:id=>({waitlistForm:form,waitlistEmail:email,waitlistMessage:message})[id] },
        AbortController,setTimeout,clearTimeout,
        fetch:async (url,config)=>{
          assert.equal(url,'https://glasify-backend.onrender.com/v1/waitlist');
          submitted=JSON.parse(config.body);
          if(outcome==='network') throw Error('offline');
          return {ok:outcome==='success'};
        }
      });
      await handler({preventDefault(){}});
      assert.deepEqual(submitted,{email:'person@example.com',platform});
      assert.equal(message.textContent, {success:'success',http:'error',network:'network'}[outcome]);
      assert.equal(button.disabled,false);
      assert.equal(email.value,outcome==='success'?'':' person@example.com ');
    });
  }
}
