import { METHOD_METADATA, MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';

export function getRoutesFromModule(module: unknown): string[] {
    const controllers = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, module);

    return controllers.reduce((acc: string[], controller) => {
        const controllerPrefix = Reflect.getMetadata(PATH_METADATA, controller);
        const methods = Object.getOwnPropertyNames(controller.prototype).filter(
            (methodName) => methodName !== 'constructor'
        );
        const routesForController = methods.reduce((accController: string[], method) => {
            const routePath = Reflect.getMetadata(PATH_METADATA, controller.prototype[method]);
            const requestMethod = Reflect.getMetadata(METHOD_METADATA, controller.prototype[method]);

            if (routePath && requestMethod !== undefined) {
                accController.push(`/${controllerPrefix}/${routePath}`);
            }
            return accController;
        }, []);

        acc.push(...routesForController);
        return acc;
    }, []);
}
