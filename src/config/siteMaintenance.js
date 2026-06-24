/**
 * დროებითი გათიშვის / გაფრთხილების რეჟიმი.
 * საიტის ჩართვისას: VITE_SITE_MAINTENANCE=false (.env ან hosting env)
 */
export const siteMaintenance = {
  enabled: import.meta.env.VITE_SITE_MAINTENANCE !== 'false',

  title: 'საიტი წაშლილია !!!!',
  subtitle: 'გაფრთხილება',
  message:
    'PEAR™ Elite პლატფორმა აღარ არის ხელმისაწვდომი. ეს საიტი წაშლილია ან სამუდამოდ გათიშულია.',
  note: 'შესვლა და რეგისტრაცია შეუძლებელია.',
}
