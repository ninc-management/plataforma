/**
 * Implement optimistic concurrency control on a Mongoose schema.
 *
 * @param {mongoose.Schema} schema - A Mongoose schema to be plugged into.
 * @param {object} options - A Mongoose schema to be plugged into.
 */

export function updateIfCurrentPlugin(schema: any, options: any) {
  schema.pre('findOneAndUpdate', function (next: any) {
    this._update.__v += 1;
    next();
  });
}
