import { Component } from '@angular/core';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">
      © {{ year }} Nortan Projetos. Template criado com ❤️ por
      <a
        href="https://akveo.page.link/8V2f"
        target="_blank"
        style="text-decoration: none;"
        >Akveo</a
      >.
    </span>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
