/**
 * Filter Validation
 * Validates filter criteria and ensures they are within acceptable bounds
 */

import { ValidationError } from '../utils/validation.js';

export interface FilterValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  allowedValues?: any[];
  pattern?: RegExp;
}

export class FilterValidator {
  private rules: Map<string, FilterValidationRule> = new Map();

  /**
   * Register a validation rule for a field
   */
  addRule(rule: FilterValidationRule): this {
    this.rules.set(rule.field, rule);
    return this;
  }

  /**
   * Register multiple validation rules
   */
  addRules(rules: FilterValidationRule[]): this {
    rules.forEach((rule) => this.addRule(rule));
    return this;
  }

  /**
   * Validate a filter value against its rule
   */
  validate(field: string, value: any): { valid: boolean; errors: string[] } {
    const rule = this.rules.get(field);

    if (!rule) {
      // No rule defined, allow by default
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return { valid: false, errors };
    }

    // Skip validation if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { valid: true, errors: [] };
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${field} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          errors.push(`${field} must be a valid date`);
        }
        break;
    }

    // Min/max validation
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }
    }

    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push(`${field} must be at least ${rule.min} characters`);
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push(`${field} must be at most ${rule.max} characters`);
      }
    }

    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push(`${field} must have at least ${rule.min} items`);
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push(`${field} must have at most ${rule.max} items`);
      }
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push(`${field} must be one of: ${rule.allowedValues.join(', ')}`);
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`${field} must match pattern ${rule.pattern}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate multiple filter values
   */
  validateAll(filters: Record<string, any>): { valid: boolean; errors: Record<string, string[]> } {
    const allErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const [field, value] of Object.entries(filters)) {
      const result = this.validate(field, value);
      if (!result.valid) {
        allErrors[field] = result.errors;
        isValid = false;
      }
    }

    return {
      valid: isValid,
      errors: allErrors,
    };
  }

  /**
   * Validate and throw on error
   */
  validateOrThrow(field: string, value: any): void {
    const result = this.validate(field, value);
    if (!result.valid) {
      throw new ValidationError(result.errors.join(', '), field, value);
    }
  }

  /**
   * Create a default product filter validator
   */
  static createProductValidator(): FilterValidator {
    const validator = new FilterValidator();

    validator.addRules([
      { field: 'page', type: 'number', min: 1, max: 500 },
      { field: 'minQty', type: 'number', min: 0 },
      { field: 'minPriceFrom', type: 'number', min: 0 },
      { field: 'minPriceTo', type: 'number', min: 0 },
      { field: 'includeOutOfStock', type: 'boolean' },
      { field: 'id', type: 'string', min: 1 },
      { field: 'platform', type: 'string', min: 1 },
      { field: 'region', type: 'string', min: 1 },
      { field: 'type', type: 'string', min: 1 },
      {
        field: 'updatedAtFrom',
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/,
      },
      { field: 'updatedAtTo', type: 'string', pattern: /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/ },
    ]);

    return validator;
  }
}
