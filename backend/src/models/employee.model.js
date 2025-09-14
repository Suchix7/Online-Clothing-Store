import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  employeeEmail: {
    type: String,
    required: true,
    unique: true,
  },
  employeePhone: {
    type: String,
    required: true,
  },
  employeePosition: {
    type: String,
    required: true,
  },
  employeeDepartment: {
    type: String,
    required: true,
    enum: ["sales", "marketing", "it", "hr", "finance"],
  },
  employeeJoinDate: {
    type: Date,
    required: true,
  },
  employeeSalary: {
    type: Number,
    required: true,
  },
  employeeStatus: {
    type: String,
    required: true,
    enum: ["active", "inactive", "probation"],
  },
  employeePhoto: {
    type: String, // path or filename of uploaded photo
  },
  employeeAddress: {
    type: String,
  },
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
