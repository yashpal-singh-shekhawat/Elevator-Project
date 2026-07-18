// A deliberately simple DI container — no decorators, no reflect-metadata.
// Enterprise-testable without pulling in a full DI framework for an Express app.
//
// Usage pattern (applied starting Module 5, once repositories/services exist):
//
//   // lifts/lift.module.ts
//   container.register('LiftRepository', () => new LiftRepository(prisma));
//   container.register('LiftService', (c) => new LiftService(c.resolve('LiftRepository')));
//
//   // lifts/lift.controller.ts
//   const liftService = container.resolve<LiftService>('LiftService');
//
// Services/repositories take their dependencies via constructor injection,
// which is what actually gives us swappability and testability — the
// container is just wiring, not magic.

type Factory<T> = (container: Container) => T;

export class Container {
  private readonly factories = new Map<string, Factory<unknown>>();
  private readonly singletons = new Map<string, unknown>();

  register<T>(token: string, factory: Factory<T>): void {
    this.factories.set(token, factory as Factory<unknown>);
  }

  resolve<T>(token: string): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`[container] No provider registered for token "${token}"`);
    }

    const instance = factory(this);
    this.singletons.set(token, instance);
    return instance as T;
  }

  /** Clears cached singleton instances. Primarily useful in test setup/teardown. */
  reset(): void {
    this.singletons.clear();
  }
}

export const container = new Container();
