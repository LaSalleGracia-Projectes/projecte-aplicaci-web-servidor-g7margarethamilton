import { type Model, type Document, type ProjectionFields } from 'mongoose';

const findOne = async <T, Doctype>(model: Model<T>, query: Record<string, any>, projection: ProjectionFields<Doctype>) => {
  try {
    return await model.findOne(query, { ...projection, __v: 0 });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const findById = async <T, Doctype>(model: Model<T>, id: string, projection: ProjectionFields<Doctype>) => {
  try {
    return await model.findById(id, { ...projection, __v: 0 });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const findAll = async <T, Doctype>(model: Model<T>, projection: ProjectionFields<Doctype>, pagination: { skip: number, limit: number }) => {
  try {
    return await model.find({}, { ...projection, __v: 0 }, pagination);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const create = async <T>(objToCreate: Document<T>) => {
  try {
    return await objToCreate.save();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const update = async <T, Doctype>(model: Model<T>, objToUpdate: Document<T>,  projection: ProjectionFields<Doctype>) => {
  try {
    return await model.findOneAndUpdate({ _id: objToUpdate._id }, { $set: objToUpdate }, {
      projection: { ...projection, __v: 0 },
      new: true,
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const remove = async <T, Doctype>(model: Model<T>, id: string, projection: ProjectionFields<Doctype>) => {
  try {
    return await model.findOneAndDelete({ _id: id }, {
      projection:  { ...projection, __v: 0 }
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export { findOne, findById, findAll, create, update, remove };