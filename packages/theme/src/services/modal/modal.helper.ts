import { Injectable, TemplateRef, Type } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { deepMerge } from '@delon/util/other';
import type { NzSafeAny } from 'ng-zorro-antd/core/types';
import { ModalOptions, NzModalService } from 'ng-zorro-antd/modal';

export interface ModalHelperOptions {
  /** 大小；例如：lg、600，默认：`lg` */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '' | number;
  /** 对话框 [ModalOptions](https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/modal/modal-types.ts) 参数 */
  modalOptions?: ModalOptions;
  /** 是否精准（默认：`true`），若返回值非空值（`null`或`undefined`）视为成功，否则视为错误 */
  exact?: boolean;
  /** 是否包裹标签页，修复模态包含标签间距问题 */
  includeTabs?: boolean;
}

/**
 * 对话框辅助类
 */
@Injectable({ providedIn: 'root' })
export class ModalHelper {
  constructor(private srv: NzModalService) {}

  /**
   * 构建一个对话框
   *
   * @param comp 组件
   * @param params 组件参数
   * @param options 额外参数
   *
   * @example
   * this.modalHelper.create(FormEditComponent, { i }).subscribe(res => this.load());
   * // 对于组件的成功&关闭的处理说明
   * // 成功，其中 `nzModalRef` 指目标组件在构造函数 `NzModalRef` 变量名
   * this.nzModalRef.close(data);
   * this.nzModalRef.close();
   * // 关闭
   * this.nzModalRef.destroy();
   */
  create(
    comp: TemplateRef<NzSafeAny> | Type<NzSafeAny>,
    params?: NzSafeAny,
    options?: ModalHelperOptions
  ): Observable<NzSafeAny> {
    options = deepMerge(
      {
        size: 'lg',
        exact: true,
        includeTabs: false
      },
      options
    );
    return new Observable((observer: Observer<NzSafeAny>) => {
      const { size, includeTabs, modalOptions } = options as ModalHelperOptions;
      let cls = '';
      let width = '';
      if (size) {
        if (typeof size === 'number') {
          width = `${size}px`;
        } else {
          cls = `modal-${size}`;
        }
      }
      if (includeTabs) {
        cls += ' modal-include-tabs';
      }
      if (modalOptions && modalOptions.nzWrapClassName) {
        cls += ` ${modalOptions.nzWrapClassName}`;
        delete modalOptions.nzWrapClassName;
      }
      const defaultOptions: ModalOptions = {
        nzWrapClassName: cls,
        nzContent: comp,
        nzWidth: width ? width : undefined,
        nzFooter: null,
        nzComponentParams: params
      };
      const subject = this.srv.create({ ...defaultOptions, ...modalOptions });
      const afterClose$ = subject.afterClose.subscribe((res: NzSafeAny) => {
        if (options!.exact === true) {
          if (res != null) {
            observer.next(res);
          }
        } else {
          observer.next(res);
        }
        observer.complete();
        afterClose$.unsubscribe();
      });
    });
  }

  /**
   * 构建静态框，点击蒙层不允许关闭
   *
   * @param comp 组件
   * @param params 组件参数
   * @param options 额外参数
   *
   * @example
   * this.modalHelper.open(FormEditComponent, { i }).subscribe(res => this.load());
   * // 对于组件的成功&关闭的处理说明
   * // 成功，其中 `nzModalRef` 指目标组件在构造函数 `NzModalRef` 变量名
   * this.nzModalRef.close(data);
   * this.nzModalRef.close();
   * // 关闭
   * this.nzModalRef.destroy();
   */
  createStatic(
    comp: TemplateRef<NzSafeAny> | Type<NzSafeAny>,
    params?: NzSafeAny,
    options?: ModalHelperOptions
  ): Observable<NzSafeAny> {
    const modalOptions = {
      nzMaskClosable: false,
      ...(options && options.modalOptions)
    };
    return this.create(comp, params, { ...options, modalOptions });
  }
}
