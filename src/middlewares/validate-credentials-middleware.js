const validateCredentials = (schema) => (req, res, next) => {
  const validated = schema.validate(req.body, {
    abortEarly: false,
    errors: {
      wrap: {
        label: "",
      },
    },
    convert: true,
  });

  if (validated.error) {
    next(validated.error);
  } else {
    req.body = validated.value;
    next();
  }
};

export default validateCredentials;
