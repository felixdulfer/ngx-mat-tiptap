import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { updateWorkspace } from '@schematics/angular/utility/workspace';
import { NgAddOptions } from './schema';

/**
 * Adds the ngx-mat-tiptap library styles to the angular.json styles array
 */
function addStylesToAngularJson(options: NgAddOptions): Rule {
  return updateWorkspace((workspace) => {
    const projectName = options.project || workspace.extensions.defaultProject as string;
    
    if (!projectName) {
      throw new Error('No project name provided and no default project found in angular.json');
    }

    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new Error(`Project "${projectName}" not found in angular.json`);
    }

    const buildTarget = project.targets.get('build');
    if (!buildTarget || !buildTarget.options) {
      throw new Error(`Build target not found for project "${projectName}"`);
    }

    const stylePath = 'node_modules/@felixdulfer/ngx-mat-tiptap/styles.css';
    const styles = buildTarget.options['styles'] as (string | { input: string })[];
    
    if (!styles) {
      buildTarget.options['styles'] = [stylePath];
    } else {
      // Check if style is already added
      const styleExists = styles.some(style => {
        if (typeof style === 'string') {
          return style === stylePath;
        }
        return style.input === stylePath;
      });

      if (!styleExists) {
        styles.push(stylePath);
      }
    }
  });
}

/**
 * Adds the required peer dependencies to package.json
 */
function addDependencies(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.skipInstall) {
      context.logger.info('Skipping installation of peer dependencies');
      return tree;
    }

    const dependencies: NodeDependency[] = [
      {
        type: NodeDependencyType.Default,
        name: '@tiptap/core',
        version: '^3.10.1',
        overwrite: false,
      },
      {
        type: NodeDependencyType.Default,
        name: '@tiptap/starter-kit',
        version: '^3.10.1',
        overwrite: false,
      },
    ];

    dependencies.forEach(dependency => {
      addPackageJsonDependency(tree, dependency);
      context.logger.info(`✅ Added "${dependency.name}" to dependencies`);
    });

    // Schedule package installation
    context.addTask(new NodePackageInstallTask());

    return tree;
  };
}

/**
 * Logs completion message
 */
function logCompletionMessage(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('✨ ngx-mat-tiptap has been successfully added to your project!');
    context.logger.info('');
    context.logger.info('Next steps:');
    context.logger.info('  1. Import the components in your module or component:');
    context.logger.info('     import { NgxMatTiptap, NgxMatTipTapFormFieldDirective } from "@felixdulfer/ngx-mat-tiptap";');
    context.logger.info('');
    context.logger.info('  2. Use the editor in your template:');
    context.logger.info('     <mat-form-field ngxMatTipTapFormField appearance="outline">');
    context.logger.info('       <ngx-mat-tiptap formControlName="content" />');
    context.logger.info('       <mat-label>Rich Text Editor</mat-label>');
    context.logger.info('     </mat-form-field>');
    context.logger.info('');
    context.logger.info('  For more information, visit: https://github.com/felixdulfer/ngx-mat-tiptap');
  };
}

/**
 * Main ng-add schematic
 */
export function ngAdd(options: NgAddOptions): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('Adding ngx-mat-tiptap to your Angular project...');

    return chain([
      addStylesToAngularJson(options),
      (tree: Tree, ctx: SchematicContext) => {
        ctx.logger.info('✅ Added styles to angular.json');
        return tree;
      },
      addDependencies(options),
      logCompletionMessage(),
    ]);
  };
}
