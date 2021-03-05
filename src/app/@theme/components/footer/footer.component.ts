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
    <div class="socials">
      <a
        href="https://www.instagram.com/nortanprojetos/"
        target="_blank"
        class="ion ion-social-instagram"
      ></a>
      <a
        href="https://www.linkedin.com/company/nortan-solução-integrada-em-projetos/"
        target="_blank"
        class="ion ion-social-linkedin"
      ></a>
      <a
        href="https://www.youtube.com/channel/UCyHRkfO7rtMiBUCkcXw5Rcw"
        target="_blank"
        class="ion ion-social-youtube"
      ></a>
    </div>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
