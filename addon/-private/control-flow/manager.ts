// Inspiration
// https://github.com/glimmerjs/glimmer.js/blob/master/packages/%40glimmer/component/addon/-private/ember-component-manager.ts
// https://github.com/rwjblue/sparkles-component/blob/master/addon/component-managers/sparkles.ts

import Ember from 'ember';
import { getOwner, setOwner } from '@ember/application';
import { capabilities } from '@ember/component';
import { schedule } from '@ember/runloop';

import BaseComponent, { setDestroyed, setDestroying } from './component';

export interface ComponentManagerArgs {
  named: object;
  positional: any[];
}

export default class ComponentManager<Component extends BaseComponent> {
  capabilities = capabilities('3.13', {
    destructor: true,
    asyncLifecycleCallbacks: true,
    updateHook: false,
  });

  static create(attrs: {}) {
    let owner = getOwner(attrs);
    return new ComponentManager(owner);
  }

  constructor(owner: unknown) {
    setOwner(this, owner);
  }

  createComponent(Klass: Constructor<Component>, args: ComponentManagerArgs) {
    let instance = new Klass(getOwner(this), args.positional);

    return instance;
  }

  didCreateComponent(_component: Component) {}

  destroyComponent(component: Component) {
    if (component.isDestroying) {
      return;
    }

    let meta = (Ember as any).meta(component);

    meta.setSourceDestroying();
    setDestroying(component);

    schedule('actions', component, component.willDestroy);
    schedule('destroy', this, scheduledDestroyComponent, component, meta);
  }

  getContext(component: Component) {
    return component;
  }
}

function scheduledDestroyComponent(component: BaseComponent, meta: any) {
  if (component.isDestroyed) {
    return;
  }

  (Ember as any).destroy(component);

  meta.setSourceDestroyed();
  setDestroyed(component);
}