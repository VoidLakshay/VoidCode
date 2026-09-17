import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({

    service: "gmail",

    auth: {

      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASS,
    },
  });
transporter.verify((err, success) => {
  if (err) {
    console.log("SMTP ERROR:", err);
  } else {
    console.log("SMTP READY");
  }
});

export default transporter;