import {Schema , model} from 'mongoose';

const eventSchema = new Schema({

    name: {type: String, required: true},
    code: {type: String, required: true, unique: true},


},{ timestamps: true });

export default model('Event', eventSchema);