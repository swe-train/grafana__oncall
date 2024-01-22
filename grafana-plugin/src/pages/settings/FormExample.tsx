import { Button, Field, Input } from '@grafana/ui';
import React from 'react';
import { useForm } from 'react-hook-form';

const FormExample = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({ mode: 'all' });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field label="First name" invalid={Boolean(errors?.firstName?.message)} error={errors?.firstName?.message}>
        <Input
          placeholder="Enter first name here"
          {...register('firstName', {
            required: 'First name is required',
            maxLength: 80,
          })}
        />
      </Field>
      <Field label="Last name" invalid={Boolean(errors?.lastName?.message)} error={errors?.lastName?.message}>
        <Input
          placeholder="Enter last name here"
          {...register('lastName', {
            required: 'Last name is required',
            maxLength: { message: 'Last name is too long', value: 100 },
          })}
        />
      </Field>
      <Field label="Email" invalid={Boolean(errors?.email?.message)} error={errors?.email?.message}>
        <Input
          placeholder="Enter email here"
          {...register('email', {
            required: 'Email is required',
            pattern: { message: 'Email needs to follow correct format', value: /^\S+@\S+$/i },
          })}
        />
      </Field>
      <Field
        label="Mobile number"
        invalid={Boolean(errors?.mobileNumber?.message)}
        error={errors?.mobileNumber?.message}
      >
        <Input
          placeholder="Enter mobile number here"
          {...register('mobileNumber', {
            required: true,
            minLength: 6,
            maxLength: 12,
          })}
        />
      </Field>
      <Button disabled={isSubmitting} type="submit">
        Submit
      </Button>
    </form>
  );
};

export default FormExample;
