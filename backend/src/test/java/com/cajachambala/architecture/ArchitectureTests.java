package com.cajachambala.architecture;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;

@AnalyzeClasses(packages = "com.cajachambala", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureTests {

    @ArchTest
    public static final ArchRule controladoresDebenTenerNombreAdecuado =
            classes()
                    .that().areAnnotatedWith(RestController.class)
                    .should().haveSimpleNameEndingWith("Controller")
                    .allowEmptyShould(true);

    @ArchTest
    public static final ArchRule controladoresNoDebenRetornarEntidadesJPA =
            noMethods()
                    .that().areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
                    .should().haveRawReturnType(DescribedPredicate.describe("entidad JPA", (JavaClass c) -> c.isAnnotatedWith(Entity.class)))
                    .because("Los controladores REST nunca deben exponer directamente entidades JPA (usar DTOs)")
                    .allowEmptyShould(true);
}
