import { cx } from "../util";

// circular photo
export type AvatarProps = {
  name: string;
  form: string;
  img: string;
};

export function Avatar({ name, form, img }: AvatarProps) {
  return (
    <div class="avatar">
      <img src={img} alt="profile image" />
      <span class="name">
        {name.split(" ").map((n, i) => {
          return <span class={cx({ first: i === 0 })}>{n}</span>;
        })}
      </span>
      <span class="form">{form}</span>
    </div>
  );
}
